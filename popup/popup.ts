import BgWindow from '../lib/BgWindow';

class Popup {
    constructor() {
        /**
         * Set up event handlers for the UI. All actual work is done in the background scripts.
         */
        document.addEventListener("DOMContentLoaded", function init() {
            setFileOptionList();
            readSpec();
            connectEventHandlers();    
            

            /**
             * If there are still un-downloaded things from last time, show them. 
             * Note: clicking one of the "download all [ |jpgs]" button will clear them.
             */
            function setFileOptionList() {
                chrome.storage.local.get({
                        prevUriMap: {}
                    }, 
                    function storageRetrieved(store: any) {
                        const uriMap: Map<string, string> = store.prevUriMap

                        // If we're still in the digging/scraping stages, restore the textual file-list.
                        // If we're in the file option download stage, show the list of file option checkboxes instead.
                        const length: number = Object.values(uriMap).length;
                        chrome.runtime.getBackgroundPage(function doDiggingForOptions(bgWindow: (Window|undefined)) {
                            if (bgWindow === undefined)
                            {
                                console.log('[Popup] bgWindow is undefined. Cannot set file option list.');
                                return;
                            }
                            const bgWin = <BgWindow>bgWindow;

                            let out: any = bgWin.output;
                            out.setDoc(document);

                            if (out.appIsScraping || out.appIsDigging) {
                                const descriptionOfWork = out.appIsScraping ? 'scraping...' : 'digging...';
                                out.toOut('Currently ' + descriptionOfWork);
                                out.restoreFileList();
                                return;
                            }
                            
                            if (!!length && length > 0) {
                                console.log("[Popup] Got persisted uris:");
                                console.log(JSON.stringify(uriMap));

                                console.log('[Popup] Got checked uris: ');
                                console.log(JSON.stringify(out.checkedFileOptUris));

                                out.showActionButtons();

                                const dir: string = bgWin.Utils.getSaltedDirectoryName();
                                out.clearFilesDug();
                                bgWin.Utils.resetDownloader();

                                let checkedItemCount: number = 0;
                                let idx: number = length - 1;

                                for (let thumbUri in uriMap) { 
                                    const uri: (string|undefined) = uriMap.get(thumbUri);
                                    if (uri === undefined)
                                    {
                                        continue;
                                    }

                                    let queryPos: number = uri.lastIndexOf('?');
                                    if (queryPos === -1) {
                                        queryPos = uri.length;
                                    }

                                    const filePath: string = dir + '/' + uri.substring(uri.lastIndexOf('/') + 1, queryPos)
                                    let optId: number = (idx--);

                                    out.addFileOption({ 
                                        id: optId + '', 
                                        uri: uri, 
                                        thumbUri: thumbUri,
                                        filePath: filePath,
                                        onSelect: bgWin.Utils.downloadFile, 
                                    });

                                    let cb: HTMLInputElement = document.getElementById('cbFile' + optId) as HTMLInputElement;
                                    if (!!cb) {
                                        if (out.checkedFileOptUris.indexOf(cb.value) !== -1) {
                                            checkedItemCount++;   
                                            cb.dataset.filePath = '';
                                            cb.checked = true;
                                            cb.disabled = true;
                                        }
                                    }
                                }

                                chrome.browserAction.setBadgeText({ text: '' + (length - checkedItemCount) + '' });
                                chrome.browserAction.setBadgeBackgroundColor({ color: [247, 81, 158, 255] });

                                if (checkedItemCount > 0) {
                                    out.toOut('Please select which of the ' + (length - checkedItemCount) + ' remaining files you wish to download.');
                                }
                                else {
                                    out.toOut('Please select which of the total ' + length + ' files you wish to download.');
                                }
                            }
                            else {
                                chrome.browserAction.setBadgeText({ text: '' });
                                out.showDigScrapeButtons();
                                out.toOut('hit a button to begin.');
                            }
                        });
                    }
                );
            }


            /**
             * Clear the persisted URI map from storage.
             */
            function clearPreviousUriMap() {
                chrome.browserAction.setBadgeText({ text: '' });
                chrome.storage.local.set({
                        prevUriMap: {},
                    },
                    function storageSet() {
                        console.log('[Popup] Cleared prev uri map');
                    }
                );
            }


            /**
             Read storage for the spec json.
            */
            function readSpec() {
                chrome.storage.sync.get({
                    spec: {
                        config: {
                            minZoomWidth: '300',
                            minZoomHeight: '300',
                            dlChannels: '11',
                            dlBatchSize: '3',
                            knownBadImgRegex: '/\\/(logo\\.|loading|header\\.jpg|premium_|preview\\.png|holder-trailer-home\\.jpg|logo-mobile-w\\.svg|logo\\.svg|logo-desktop-w\\.svg|user\\.svg|speech\\.svg|folder\\.svg|layers\\.svg|tag\\.svg|video\\.svg|favorites\\.svg|spinner\\.svg|preview\\.jpg)/i',
                        },
                        messages: [],
                        processings: [],
                        blessings: [],
                    }
                }, 
                function storageRetrieved(store) {
                    chrome.runtime.getBackgroundPage(function setSpec(bgWindow: (Window|undefined)) {
                        if (bgWindow === undefined) {
                            console.log('[Popup] bgWindow was null. Could not set options specs.')
                            return;
                        }
                        const bgWin = bgWindow as BgWindow;

                        bgWin.digger.setBatchSize(store.spec.config.dlBatchSize);
                        bgWin.digger.setChannels(store.spec.config.dlChannels);

                        bgWin.logicker.setMinZoomHeight(store.spec.config.minZoomHeight);
                        bgWin.logicker.setMinZoomWidth(store.spec.config.minZoomWidth);
                        bgWin.logicker.setKnownBadImgRegex(store.spec.config.knownBadImgRegex);

                        bgWin.logicker.setMessages(store.spec.messages);
                        bgWin.logicker.setProcessings(store.spec.processings);
                        bgWin.logicker.setBlessings(store.spec.blessings);
                    });
                });
            }


            /**
             * Connect up all the event handlers.
             */
            function connectEventHandlers () {
                /**
                 * Scrape and dig, but don't automatically download. Instead, present the user with checkbox options
                 * as to what files to download.
                 */
                document.getElementById('digFileOptionsButton')?.addEventListener('click', function onDigFileOptions() {
                    chrome.runtime.getBackgroundPage(function doDiggingForOptions(bgWindow: (Window|undefined)) {
                        let bgWin = bgWindow as BgWindow;
                        bgWin?.eventPage.goDigFileOptions(window.document);
                    });
                });


                /**
                 * Scrape and dig a page that contains links to multiple galleries. Don't automatically download. 
                 * Present the user with checkbox options as to what files to download.
                 */
                document.getElementById('digGalleryGallery')?.addEventListener('click', function onDigGalleryGallery() {
                    chrome.runtime.getBackgroundPage(function doGalleryGalleryDigging(bgWindow: (Window|undefined)) {
                        let bgWin = bgWindow as BgWindow;
                        bgWin?.eventPage.goDigGalleryGallery(window.document);
                    });
                });


                /**
                 * This button is in the "action buttons" group. They act upon the list of file download options. This
                 * fires all the checkboxes' click events, causing them all the download.
                 */
                document.getElementById('getAllFileOptsButton')?.addEventListener('click', function getAllFileOpts() {
                    document.querySelectorAll('input[type="checkbox"]').forEach(function initiateDownload(cbEl: Element) {
                        let evt: MouseEvent = new MouseEvent('click');
                        cbEl.dispatchEvent(evt);
                    });
                });


                /**
                 * This button is in the "action buttons" group. They act upon the list of file download options. This
                 * fires the checkboxes' click events for all jpg files only.
                 */
                document.getElementById('getAllJpgOptsButton')?.addEventListener('click', function getAllJpgOpts() {
                    document.querySelectorAll('input[type="checkbox"]').forEach(function initiateJpgDownload(cbEl: Element) {
                        if ((cbEl as HTMLInputElement)?.dataset?.filePath?.match(new RegExp(/\.(jpg|jpeg)$/, 'i'))) {
                            let evt: MouseEvent = new MouseEvent('click');
                            cbEl.dispatchEvent(evt);
                        }
                    });
                });


                /**
                 * This button is in the "action buttons" group. It clears the download list, clears the 
                 * previouslyHarvestedUriMap, shows the scrape/dig buttons, and hides the "action buttons".
                 */
                document.getElementById('clearFileListButton')?.addEventListener('click', function clearFileList() {
                    chrome.runtime.getBackgroundPage(function clearTheFileList(bgWindow: (Window|undefined)) {
                        if (bgWindow === undefined) {
                            console.log('[Popup] bgWindow is undefined. Cannot clear file options list.');
                            return;
                        }
                        clearPreviousUriMap();
                        
                        const out = (bgWindow as BgWindow).output;
                        out.setDoc(document);           
                        out.clearFilesDug();
                        out.resetFileData();
                        out.showDigScrapeButtons();

                        out.toOut('Hit a button to begin.');
                    });
                });


                /**
                 * Scrape for all known types of media on a page.
                 */
                document.getElementById('scrapeFileOptionsButton')?.addEventListener('click', function onDigFileOptions() {
                    chrome.runtime.getBackgroundPage(function doScrapingForOptions(bgWindow: (Window|undefined)) {
                        if (bgWindow === undefined) {
                            console.log('[Popup] bgWindow is undefined. Cannot scrape file options list.');
                            return;
                        }

                        (bgWindow as BgWindow).eventPage.goScrapeFileOptions(window.document);
                    });
                });


                /**
                 * Scrape a page, picking up all the included images.
                 */
                document.getElementById("scrapeImagesButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doImageGalleryDig(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goScrapeImages(window.document);
                    });
                });


                /**
                 * Scrape a page, picking up all the included videos.
                 */
                document.getElementById("scrapeVideosButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doImageGalleryDig(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goScrapeVideos(window.document);
                    });
                });


                /**
                 * A big one, scrape a page for *any* media.
                 */
                document.getElementById("scrapeButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doImageGalleryDig(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goScrape(window.document);
                    });
                });


                /**
                 * Dig an image gallery.
                 */
                document.getElementById("digImageGalleryButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doImageGalleryDig(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goDigImageGallery(window.document);
                    });
                });


                /**
                 * Dig a video gallery.
                 */
                document.getElementById("digVideoGalleryButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doVideoGalleryDig(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goDigVideoGallery(window.document);
                    });
                });


                /**
                 * The big one, digging *everything* that could be from a gallery.
                 */
                document.getElementById("digButton")?.addEventListener("click", function onDigButton() {
                    chrome.runtime.getBackgroundPage(function doDigging(bgWindow: (Window|undefined)) {
                        (bgWindow as BgWindow).eventPage.goDig(window.document);
                    });
                });


                /**
                 * Toggle the Voyeur.
                 */
                document.getElementById("toggleVoyeur")?.addEventListener("click", function onToggleVoyeurButton() {
                    chrome.runtime.getBackgroundPage(function toggleVoyeur(bgWindow: (Window|undefined)) {
                        let bgWin: BgWindow = bgWindow as BgWindow;

                        if (bgWin.Voyeur.isWatching) {
                            bgWin.Voyeur.stop();
                        }
                        else {
                            bgWin.Voyeur.start();
                        }
                    });
                });
            }
        });
    }
}

(<any>window)['Popup'] = new Popup();

export default Popup;
