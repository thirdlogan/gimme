/**
 * Singleton for holding the shared constants. 
 */
class Constance {
     // Enumeration of the spec form sections.
    public static readonly SECTIONS: any = {
        CONFIG: 'CONFIG',
        MESSAGES: 'MESSAGES',
        PROCESSINGS: 'PROCESSINGS',
        BLESSINGS: 'BLESSINGS',
    };

    // Enumeration of the labels to use for the spec form elements.
    public static readonly LABELS: any = {
        CONFIG: {
            minZoomWidth: 'min full-sized image width',
            minZoomHeight: 'minimum full-sized image height',
            dlChannels: 'number of download channels for gallery-gallery-digs',
            dlBatchSize: 'number of downloads in a batch for gallery-gallery-digs',
            knownBadImgRegex: 'regex to match image uris that are never what we are looking for', 
        },
        MESSAGES: {
            match: 'regex to match the site uri',
            link: 'css selector for getting the link element pointing to the full-sized image page',
            href: 'javascript property path for getting the proper link uri from the link element',
            thumb: 'css scoped sub-selector of the thumbnail image element relative to the link element',
            src: 'javascript property path for getting the proper thumbnail source uri from the thumbnail element',
        },
        PROCESSINGS: {
            match: 'regex to match the site uri',
            actions: 'list of transformations to do on the matched uri',
            actions_noun: 'do matching on the thumbnail image uri (src), or the link uri (href)',
            actions_verb: 'the type of uri treansformation to do (ie "replace")',
            actions_match: 'regex for what text in the selected src/href to replace/transform',
            actions_new: 'new text for replacing/transforming the matched text of the uri',
            dig: 'force always use dig-engine discovery of full-sized images',
            scrape: 'force always use scrape-engine discovery of thumbnail images',
        },
        BLESSINGS: {
            match: 'regex to match the site uri of detail pages containing the full-sized image',
            zoom: 'css selector for the full-sized image element on the page',
            src: 'javascript property path for getting the full-sized image source uri from the image element',
        },
    };
    
    // These are the default spec values.
    public static readonly cannedConfig: any = {
        minZoomWidth: '300',
        minZoomHeight: '300',
        dlChannels: '5',
        dlBatchSize: '5',
        knownBadImgRegex: '/\\/(logo\\.|loading|header\\.jpg|premium_|preview\\.png|holder-trailer-home\\.jpg|logo-mobile-w\\.svg|logo\\.svg|logo-desktop-w\\.svg|user\\.svg|speech\\.svg|folder\\.svg|layers\\.svg|tag\\.svg|video\\.svg|favorites\\.svg|spinner\\.svg|preview\\.jpg)/i',
    };
    public static readonly cannedProcessings: Array<any> = [
        {
            match: 'fakeexample.fake',
            actions: [
                {
                    noun: 'src',
                    verb: 'replace',
                    match: '/^t-/',
                    new: 'big-'
                },
                {
                    noun: 'href',
                    verb: 'replace',
                    match: '/\\/fakeout\\//',
                    new: '/realpath/'
                }
            ],
            dig: true,
            scrape: false,
        }
    ];
    public static readonly cannedMessages: Array<any> = [
        {
            match: 'fakeexample.fake',
            link: 'a.link[href]',
            href: 'href',
            thumb: 'img.thumb[data-src]',
            src: 'dataset.src',
        }
    ];
    public static readonly cannedBlessings:Array<any> = [
        {
            match: 'fakeexample.fake',
            zoom: 'img.zoomed',
            src: 'src',
        }
    ];

    // The default spec, used if there is nothing in storage yet.
    public static readonly DEFAULT_SPEC: any = {
        config: Constance.cannedConfig,
        messages: Constance.cannedMessages,
        processings: Constance.cannedProcessings,
        blessings: Constance.cannedBlessings,
    };
 };


/**
 * Singleton which handles layout and serialization to and from the HTML5 form
 * for the options spec values.
 */
class Dominatrix {
    // We're a singleton.
    private static instance: Dominatrix = new Dominatrix(document);

    // Counters used in creating unique element ids.
    private entryCounter: number = 0;
    private subEntryCounter: number = 0;
    
    // Id prefixes for unique element ids, and classnames for entry holder <div>s. 
    public static readonly ENTRY_DIV_ID_PREFIX = 'entry_';
    public static readonly SUB_ENTRY_DIV_ID_PREFIX = 'subentry_';
    public static readonly VALUE_ID_PREFIX = 'value_';
    public static readonly ADD_SUB_ENTRY_ID_PREFIX = 'addsubentry_';
    public static readonly ENTRY_CLASS = 'entry';
    public static readonly SUB_ENTRY_CLASS = 'subentry';
    public static readonly DELETE_BUTTON_CLASS = 'delete';
    public static readonly ADD_SUB_ENTRY_CLASS = 'addSubentry';
  
    // Members holding the document and its configuration sections.
    // populated in constructor.
    public SECTION_ELEMENTS: any;    
    public doc: Document;


    /**
     * Private constructor. It looks up and stores our parts of the document.
     * @param d 
     */
    private constructor(d: Document) {
        this.doc = d;

        this.SECTION_ELEMENTS = {
            CONFIG: this.doc.getElementById(Constance.SECTIONS.CONFIG),
            MESSAGES: this.doc.getElementById(Constance.SECTIONS.MESSAGES),
            PROCESSINGS: this.doc.getElementById(Constance.SECTIONS.PROCESSINGS),
            BLESSINGS: this.doc.getElementById(Constance.SECTIONS.BLESSINGS),
        }
    }


    /**
     * Getter for the singleton instance.
     */
    public static getInstance(): Dominatrix {
        return this.instance;
    }


    /**
     * Add one object entry of an options section to the HTML5 form.
     * 
     * @param {*} values Array of value objects which describe the entry.
     * @param {*} section Section of the options spec the entry belongs to.
     * @param {*} isSubEntry Flag used for recursion.
     * @param {*} insertionRefNode DOM node before which to insert the entry.
     */
    public addEntry(values: any[], section: HTMLDivElement, isSubEntry?: boolean, insertionRefNodeId?: (string|undefined)): string {
        let div: HTMLDivElement = this.doc.createElement('div');

        if (isSubEntry) {
            div.id = Dominatrix.SUB_ENTRY_DIV_ID_PREFIX + (this.subEntryCounter++);
            div.className = Dominatrix.SUB_ENTRY_CLASS;
        }
        else {
            div.id = Dominatrix.ENTRY_DIV_ID_PREFIX + (this.entryCounter++);
            div.className = Dominatrix.ENTRY_CLASS;
        }

        if (Array.isArray(values)) {
            // This variable is for a closure. Do not delete.
            let valueLength: number = values.length;
            
            for (let i: number = 0; i < values.length; i++) {
                var value: any = values[i];

                if (!value) {
                    continue;
                }

                let label: (HTMLLabelElement|boolean) = (!!value.label ? this.doc.createElement('label') : false);
                let valueId: string = div.id + '_' + Dominatrix.VALUE_ID_PREFIX + i;

                // Create and append the label if we were told to label this.
                if (!!label) {
                    label.textContent = value.label;
                    label.htmlFor = valueId;
                    div.appendChild(label);
                }

                // Create the input that represents the value.
                let input: HTMLInputElement = this.doc.createElement('input');
                input.id = valueId;
                input.name = valueId;
                input.dataset.key = value.key;
                div.appendChild(input);                

                var inputValue = '';
                
                // For array values, use the div id of the subentry.
                if (('values' in value) && Array.isArray(value.values)) {
                    // Now recurse to add the subentry values.
                    let subEntryId = this.addEntry(value.values, div, true, undefined);
                    input.type = 'hidden';                    
                    inputValue = subEntryId;
                    
                    // Hook up the addSubEntry button to add new subentries. Only place the
                    // button after the last subentry value in the array. 
                    if ((i+1) === values.length || values[i+1].key !== value.key) {
                        // Wrap this in an IIFE to avoid closure problems.
                        ((d, rootNode, val, refEntryId) => {  
                            let refNode: (HTMLElement|null) = d.getElementById(refEntryId);

                            // Build the 'add subentry' button, and insert it into the <div>.
                            let addSubEntry: HTMLButtonElement = d.createElement('button');
                            addSubEntry.id = Dominatrix.ADD_SUB_ENTRY_ID_PREFIX + i;
                            addSubEntry.className = Dominatrix.ADD_SUB_ENTRY_CLASS;
                            addSubEntry.textContent = 'add subentry';
                            rootNode.insertBefore(addSubEntry, refNode);                                                

                            // Create the 'add subentry' click handler. It creates a new label for the 
                            // subentry section, adds the subentry by copying an existing subentry's values,
                            // and creates the needed hidden element that points to it.
                            addSubEntry.addEventListener('click', () => {
                                // new subentry's id                                
                                let newValueId = rootNode.id + '_' + Dominatrix.VALUE_ID_PREFIX + (i++);
                                
                                // Make it a label if needed.
                                if (!!val.label) {
                                    let newLabel: HTMLLabelElement = d.createElement('label');
                                    newLabel.id = 'label_' + newValueId
                                    newLabel.textContent = val.label;
                                    newLabel.htmlFor = newValueId;
                                    rootNode.insertBefore(newLabel, addSubEntry); 
                                }

                                 // Create the hidden input that points to this subentry.
                                 let newInput: HTMLInputElement = d.createElement('input');
                                 newInput.id = newValueId;
                                 newInput.type = 'hidden';
                                 newInput.name = newValueId;
                                 newInput.dataset.key = val.key;
                                 rootNode.insertBefore(newInput, addSubEntry);
                                
                                // Add the subentry to the <div>.
                                let addedSubentryId = this.addEntry(val.values, rootNode, true, newValueId);
                                newInput.value = addedSubentryId;

                                // Unhide all the subentries' delete buttons in the section.
                                let deleteButtons: (NodeListOf<HTMLButtonElement>|undefined) = 
                                    div.parentNode?.querySelectorAll<HTMLButtonElement>(':scope button.' + Dominatrix.DELETE_BUTTON_CLASS);

                                if (!!deleteButtons) {
                                    deleteButtons.forEach(function showButton(dButton: HTMLButtonElement) {
                                        if (!!dButton.parentNode && dButton.parentElement?.className === Dominatrix.SUB_ENTRY_CLASS) {
                                            dButton.style.display = '';
                                        }
                                    });
                                }
                            });
                        })(this.doc, div, value, subEntryId);
                    }
                }
                // For scalar values, use value.text or the value itself.
                else {
                    input.type = 'text';                    
                    inputValue = (('text' in value) ? value.text.toString() : value.toString());;
                }
                input.value = inputValue;
            }

            // Create a delete button for the entry/subentry. If we're dealing with the first
            // subentry of a list of subentries, do not create a delete button for it.
            let deleteButton = this.doc.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.className = Dominatrix.DELETE_BUTTON_CLASS;
            deleteButton.addEventListener('click', function onDeleteButtonClick() {
                // Remove the subentry title (like 'actions'), then the hidden input
                // for the subentry, then the subentry itself.
                if (!!div.previousElementSibling && (div.previousElementSibling as HTMLInputElement).value === div.id) {
                    div.previousElementSibling.previousSibling?.remove();
                    div.previousElementSibling.remove();
                }
                div.remove();

                // If there is only 1 subentry left, find it and hide its delete button.
                // otherwise, show all the subentries' delete buttons.
                let remainingSubentries: NodeListOf<HTMLDivElement> = section.querySelectorAll(':scope div.' + Dominatrix.SUB_ENTRY_CLASS);
                if (remainingSubentries.length === 1) {
                    let deleteButton: (Node|null) = remainingSubentries[0].querySelector(':scope button.' + Dominatrix.DELETE_BUTTON_CLASS);
                    
                    if (deleteButton != null) {
                        (deleteButton as HTMLElement).style.display = 'none';
                    }
                }
            });
            
            // append the delete button.
            div.appendChild(deleteButton);
        }

        // Add the new entry to the section, optionally before a reference node, or 
        // just add it to the end of the doc if no section was given.
        if (!!section) {
            if (!!insertionRefNodeId) {
                section.insertBefore(div, this.doc.getElementById(insertionRefNodeId));
            }
            else {
                section.appendChild(div);
            }
        }
        else {
            this.doc.body.appendChild(div);
        }

        // return the new entry's id.
        return div.id;
    }


    /**
     * Add form fields for the config values.
     */
    public insertConfigEntry(configEntry: any): string {
        var entryId = this.addEntry(configEntry, this.SECTION_ELEMENTS.CONFIG);
        return entryId;
    }


    /**
     * Add form fields for a single message.
     */
    public insertMessageEntry(messageEntry: any): string {
        var entryId = this.addEntry(messageEntry, this.SECTION_ELEMENTS.MESSAGES);
        return entryId;
    };


    /**
     * Add populated form fields for a single processing.
     */
    public insertProcessingEntry(processingEntry: any): string {
        var entryId = this.addEntry(processingEntry, this.SECTION_ELEMENTS.PROCESSINGS);
        return entryId;
    };


    /**
     * Add populated form fields for a single blessing.
     */
    public insertBlessingEntry(blessingEntry: any): string {
        var entryId = this.addEntry(blessingEntry, this.SECTION_ELEMENTS.BLESSINGS);
        return entryId;
    };


    /**
     * Get a serialized object for a single options entry from a particular section
     * of the options form.
     * 
     * @param {*} root The root element for the section containing the entry.
     */
    public getEntry(root: HTMLDivElement): HTMLDivElement {
        let entry: HTMLDivElement = new HTMLDivElement();
        let textInputs: Array<HTMLInputElement> = [];
        let hiddenInputs: Array<HTMLInputElement> = [];

        // Sort out the text inputs and hidden inputs.
        for (let i: number = 0; i < root.children.length; i++) { 
            let child = root.children[i];

            if (child.nodeName === 'INPUT') {
                let inputType = child.getAttribute('type');
                let inputEl = (child as HTMLInputElement);

                if (inputType === 'text') {
                    textInputs.push(inputEl);
                }
                else if (inputType === 'hidden') {
                    hiddenInputs.push(inputEl);
                }
            }
        }

        textInputs.forEach((input: HTMLInputElement) => {
            if (input.dataset.key) {
                (entry as any)[input.dataset.key] = input.value;
            }
        });

        hiddenInputs.forEach((input: HTMLInputElement) => {
            if (input.dataset.key) {
                if (!(input.dataset.key in entry)) {
                    (entry as any)[input.dataset.key] = [];
                }
                else if (!Array.isArray((entry as any)[input.dataset.key])) {
                    (entry as any)[input.dataset.key] = [ (entry as any)[input.dataset.key] ];
                }

                let subEntry: HTMLDivElement = (input.nextElementSibling as HTMLDivElement);
                if (!!subEntry && subEntry.className === Dominatrix.SUB_ENTRY_CLASS) {
                    (entry as any)[input.dataset.key].push(this.getEntry(subEntry));
                }
            }
        });

        return entry;
    }


    /**
     * Return a serialized array of entries in a section of the options form.
     * 
     * @param {*} section Spec section whose objects are being asked for.
     */
     public getEntries(section: HTMLDivElement): Array<HTMLDivElement> {
        let entries = new Array<HTMLDivElement>();
        let divs = new Array<HTMLDivElement>();
    
        for (let i: number = 0; i < section.children.length; i++) {
            let child: HTMLElement = (section.children[i] as HTMLElement);
            if (child.nodeName === 'DIV' && child.className === Dominatrix.ENTRY_CLASS) {
                divs.push((child as HTMLDivElement));
            }
        }

        divs.forEach((div: HTMLDivElement) => {
            entries.push((this.getEntry(div) as HTMLDivElement));
        });

        return entries;
    }


    /**
     * Return the object representing the config section of the options form.
     */
    public getConfig(): HTMLDivElement {
        return this.getEntry(this.SECTION_ELEMENTS.CONFIG);
    };

    
    /**
     * Return the serialized array of messages from the options form.
     */
    public getMessageEntries(): Array<HTMLDivElement> {
        return this.getEntries(this.SECTION_ELEMENTS.MESSAGES);
    };


    /**
     * Return the serialized array of processings from the options form.
     */
    public getProcessingEntries(): Array<HTMLDivElement> {
        return this.getEntries(this.SECTION_ELEMENTS.PROCESSINGS);
    };


    /**
     * Return the serialized array of blessings from the options form.
     */
    public getBlessingEntries(): Array<HTMLDivElement> {
        return this.getEntries(this.SECTION_ELEMENTS.BLESSINGS);
    };
}


/**
 * Singleton which handles getting, setting, and processing the options spec values
 * to/from storage.
 */
class Optionator {
    // The singleton instance
    private static instance: Optionator = new Optionator(document);

    // Refs
    private doc: Document;
    private dmx: Dominatrix = Dominatrix.getInstance();

    // The returned object. Merely the tracking ids of the form elements.
    public trackingIds: any = {
        ids: {
            CONFIG: [],
            MESSAGES: [],
            PROCESSINGS: [],
            BLESSINGS: [],
        },
    };

    // Enumeration of the DOM insertion functions.
    public INSERT_FUNCS: any = {
        CONFIG: this.dmx.insertConfigEntry,
        MESSAGES: this.dmx.insertMessageEntry,
        PROCESSINGS: this.dmx.insertProcessingEntry,
        BLESSINGS: this.dmx.insertBlessingEntry,
    };

    /**
     * A singleton, so private constructor.
     * 
     * @param d The options.html document
     */
    private constructor(d: Document) {
        this.doc = d;

        // Do setup on DOMContentLoaded.
        this.doc.addEventListener('DOMContentLoaded', () => {
            // Load the spec from storage, and trigger the layout.
            this.getSpec();

            // Hook up the event handlers for each section's "Add" button on DOMContentLoaded.
            let buttons = (this.doc.querySelectorAll('button.addEntry') as NodeListOf<HTMLButtonElement>);
            buttons.forEach((button: HTMLButtonElement) => {
                button.addEventListener('click', () => {
                    if (!!button.parentElement) {
                        let section: string = button.parentElement.id;
                        this.layoutSpecSection(Constance.SECTIONS[section], Constance.DEFAULT_SPEC[section.toLowerCase()]);
                    }
                });
            });

            // Hook up the "set" button.
            let setButton: (HTMLElement|null) = this.doc.getElementById('set');
            if (!!setButton && setButton !== null) {
                setButton.addEventListener('click', this.setSpec);
            }
        });
    }


    /**
     * The singleton getter.
     */
    public getInstance(): Optionator {
        return Optionator.instance;
    }


    /**
     * Get the options from storage, if they're there. Use the default spec
     * if nothing is in storage yet.
     */
    public getSpec(): void {
        let me: Optionator = this;

        chrome.storage.sync.get({
                spec: Constance.DEFAULT_SPEC
            }, 
            function storageRetrieved(store) {
                me.layoutConfig(store.spec.config);
                me.layoutMessages(store.spec.messages);
                me.layoutProcessings(store.spec.processings);
                me.layoutBlessings(store.spec.blessings);
            }
        );
    }


    /**
     * Set the values typed into the textarea. If it does not parse, then 
     * say so in the status and do not actually set.
     */
    public setSpec(): void {
        let spec: any = {};

        spec.config = this.dmx.getConfig();
        spec.messages = this.dmx.getMessageEntries();
        spec.processings = this.dmx.getProcessingEntries();
        spec.blessings = this.dmx.getBlessingEntries();

        console.log('Trying to set spec:');
        console.log(JSON.stringify(spec));
        console.log('\n');

        chrome.storage.sync.set({
                spec: spec,
            },
            function storageSet() {
                let statusDiv: (HTMLElement|null) = Optionator.instance.doc.getElementById('status');

                // Show the "successfully set" message, then hide it again in 5 seconds.
                if (!!statusDiv && statusDiv != null) {
                    statusDiv.style.display = 'block';

                    setTimeout(function clearMessage() {
                        let statusDiv: (HTMLElement|null) = Optionator.instance.doc.getElementById('status');
                        if (!!statusDiv && statusDiv != null) {
                            statusDiv.style.display = 'none';
                        }
                    }, 5000);
                }
            }
        );
    }


    /**
     * Process the spec section's objects, and call Dominatrix to lay them out
     * on the form.
     * 
     * @param {*} section Section of the spec, using SECTIONS enum
     * @param {*} objects Objects existing in that spec section
     */
    public layoutSpecSection(section: any, objects: Array<any>) {
        // For each of the section objects, process and lay it out.
        objects.forEach((obj: any) => {
            let objEntry: Array<any> = new Array<any>();

            // For each key/value pair in the section object, add it to the objEntry.
            Object.keys(obj).forEach((key: string) => {
                // Some values are arrays of objects. Process them into arrays of label,
                // text, key sets. 
                if (Array.isArray(obj[key])) {
                    // For each of the subarray objects, process it.
                    obj[key].forEach((subObj: any) => {
                        let subValues: any = new Array<any>();
                        
                        // Similarly to the main forEach(), process each subobject key/value pair.
                        // (Could probably be recursive here.)
                        Object.keys(subObj).forEach((subKey: string) => {
                            var subLabel = (Constance.LABELS[section][key + '_' + subKey] || '');
                            var subText = (subObj[subKey] || '');

                            subValues.push({
                                label: subLabel,
                                text: subText,
                                key: subKey,
                            });
                        });

                        // Add the values array to the object entry.
                        objEntry.push({
                            label: Constance.LABELS[section][key],
                            values: subValues,
                            key: key,
                        });
                    });
                }
                // Scalar values are simpler. Just process out their label, text, and key. 
                // Then put them in the object entry.
                else {
                    var label = (Constance.LABELS[section][key] || '');
                    var text = (obj[key] || '');

                    var valueObj = {
                        label: label,
                        text: text,
                        key: key,
                    };

                    if (key === 'match') {
                        objEntry.splice(0,0,valueObj);
                    }
                    else {
                        objEntry.splice(-2,0,valueObj);
                    }
                }
            });

            // Call the proper Dominatrix layout function, and add the id to our tracking object.
            var entryId = this.INSERT_FUNCS[section](objEntry);
            this.trackingIds.ids[section].push(entryId);
        });
    }


    /**
     * Create and populate the fields for spec.config. This is a single object
     * full of one-off configuration properties.
     */
    public layoutConfig(config: any): void {
        this.layoutSpecSection(Constance.SECTIONS.CONFIG, [config]);
    }


    /**
     * Create and populate the fields for spec.messages. This is an array of objects,
     * each of which contains keys for how the content-script can identify thumb, src,
     * link, and href values for a gallery item on a page that matches the "match" key's
     * regular expression.
     */
    public layoutMessages(messages: any): void {
        this.layoutSpecSection(Constance.SECTIONS.MESSAGES, messages);
    }


    /**
     * Create and populate the fields for spec.processings. This is an array of objects,
     * each of which contains keys for how the Logicker should do post-processing on 
     * the content-script's galleryMap. Each holds a "match" regexp for the uri, "doDig", 
     * "doScrape", and array of "actions" of varying types.
     */
    public layoutProcessings(processings: any): void {
        this.layoutSpecSection(Constance.SECTIONS.PROCESSINGS, processings);
    }


    /**
     * Create and populate the fields for spec.blessings. This is an array of objects, each
     * of which contains keys for how the Logicker can identify a zoom-item on a zoom-page for
     * a gallery item. Each holds a "match" regexp for the uri, and a css selector "zoom" for
     * the zoom item, and a "src" prop for the direct link to the resource.
     */
    public layoutBlessings(blessings: any): void {
        this.layoutSpecSection(Constance.SECTIONS.BLESSINGS, blessings);
    }   
}