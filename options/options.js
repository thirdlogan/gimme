'use strict'


/**
 * Singleton for holding the shared constants. 
 */
var Constance = (function() {
    var me = {};

     // Enumeration of the spec form sections.
    me.SECTIONS = {
        CONFIG: 'CONFIG',
        MESSAGES: 'MESSAGES',
        PROCESSINGS: 'PROCESSINGS',
        BLESSINGS: 'BLESSINGS',
    };

    // Enumeration of the labels to use for the spec form elements.
    me.LABELS = {
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
            dig: 'always use dig-engine discovery of full-sized images',
            scrape: 'always use scrape-engine discovery of thumbnail images',
        },
        BLESSINGS: {
            match: 'regex to match the site uri of detail pages containing the full-sized image',
            zoom: 'css selector for the full-sized image element on the page',
            src: 'javascript property path for getting the full-sized image source uri from the image element',
        },
    };
    
    // These are the default spec values.
    var cannedConfig = {
        minZoomWidth: '300',
        minZoomHeight: '300',
        dlChannels: '5',
        dlBatchSize: '5',
        knownBadImgRegex: '/\\/(logo\\.|loading|header\\.jpg|premium_|preview\\.png|holder-trailer-home\\.jpg|logo-mobile-w\\.svg|logo\\.svg|logo-desktop-w\\.svg|user\\.svg|speech\\.svg|folder\\.svg|layers\\.svg|tag\\.svg|video\\.svg|favorites\\.svg|spinner\\.svg|preview\\.jpg)/i',
    };
    var cannedProcessings = [
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
    var cannedMessages = [
        {
            match: 'fakeexample.fake',
            link: 'a.link[href]',
            href: 'href',
            thumb: 'img.thumb[data-src]',
            src: 'dataset.src',
        }
    ];
    var cannedBlessings = [
        {
            match: 'fakeexample.fake',
            zoom: 'img.zoomed',
            src: 'src',
        }
    ];

    // The default spec, used if there is nothing in storage yet.
    me.DEFAULT_SPEC = {
        config: cannedConfig,
        messages: cannedMessages,
        processings: cannedProcessings,
        blessings: cannedBlessings,
    };


    return me;
 })();


/**
 * Singleton which handles layout and serialization to and from the HTML5 form
 * for the options spec values.
 */
var Dominatrix = (function Dominatrix(doc, C) {
    var me = {};
    
    // Counters used in creating unique element ids.
    var entryCounter = 0;
    var subEntryCounter = 0;
    
    // Id prefixes for unique element ids, and classnames for entry holder <div>s. 
    var ENTRY_DIV_ID_PREFIX = 'entry_';
    var SUB_ENTRY_DIV_ID_PREFIX = 'subentry_';
    var VALUE_ID_PREFIX = 'value_';
    var ADD_SUB_ENTRY_ID_PREFIX = 'addsubentry_';
    var ENTRY_CLASS = 'entry';
    var SUB_ENTRY_CLASS = 'subentry';
    var DELETE_BUTTON_CLASS = 'delete';
    var ADD_SUB_ENTRY_CLASS = 'addSubentry';

    // Enumeration of section holder <div>s that exist on the options form page.
    var SECTION_ELEMENTS = {
        CONFIG: doc.getElementById(C.SECTIONS.CONFIG),
        MESSAGES: doc.getElementById(C.SECTIONS.MESSAGES),
        PROCESSINGS: doc.getElementById(C.SECTIONS.PROCESSINGS),
        BLESSINGS: doc.getElementById(C.SECTIONS.BLESSINGS),
    }


    /**
     * Add one object entry of an options section to the HTML5 form.
     * 
     * @param {*} values Array of value objects which describe the entry.
     * @param {*} section Section of the options spec the entry belongs to.
     * @param {*} isSubEntry Flag used for recursion.
     * @param {*} insertionRefNode DOM node before which to insert the entry.
     */
    function addEntry(values, section, isSubEntry, insertionRefNodeId) {
        var div = doc.createElement('div');

        if (isSubEntry) {
            div.id = SUB_ENTRY_DIV_ID_PREFIX + (subEntryCounter++);
            div.className = SUB_ENTRY_CLASS;
        }
        else {
            div.id = ENTRY_DIV_ID_PREFIX + (entryCounter++);
            div.className = ENTRY_CLASS;
        }

        if (Array.isArray(values)) {
            // This variable is for a closure. Do not delete.
            var valueLength = values.length;
            
            for (var i = 0; i < values.length; i++) {
                var value = values[i];

                if (!value) {
                    continue;
                }

                var label = (!!value.label ? doc.createElement('label') : false);
                var valueId = div.id + '_' + VALUE_ID_PREFIX + i;

                // Create and append the label if we were told to label this.
                if (!!label) {
                    label.textContent = value.label;
                    label.for = valueId;
                    div.appendChild(label);
                }

                // Create the input that represents the value.
                var input = doc.createElement('input');
                input.id = valueId;
                input.name = valueId;
                input.dataset.key = value.key;
                div.appendChild(input);                

                var inputValue = '';
                
                // For array values, use the div id of the subentry.
                if (('values' in value) && Array.isArray(value.values)) {
                    // Now recurse to add the subentry values.
                    var subEntryId = addEntry(value.values, div, true);
                    input.type = 'hidden';                    
                    inputValue = subEntryId;
                    
                    // Hook up the addSubEntry button to add new subentries. Only place the
                    // button after the last subentry value in the array. 
                    if ((i+1) === values.length || values[i+1].key !== value.key) {
                        // Wrap this in an IIFE to avoid closure problems.
                        (function buildAddSubEntryButton(d, rootNode, val, refEntryId) {  
                            var refNode = d.getElementById(refEntryId);

                            // Build the 'add subentry' button, and insert it into the <div>.
                            var addSubEntry = d.createElement('button');
                            addSubEntry.id = ADD_SUB_ENTRY_ID_PREFIX + i;
                            addSubEntry.className = ADD_SUB_ENTRY_CLASS;
                            addSubEntry.textContent = 'add subentry';
                            rootNode.insertBefore(addSubEntry, refNode);                                                

                            // Create the 'add subentry' click handler. It creates a new label for the 
                            // subentry section, adds the subentry by copying an existing subentry's values,
                            // and creates the needed hidden element that points to it.
                            addSubEntry.addEventListener('click', function() {
                                // Create the label.
                                var newLabel = (!!val.label ? d.createElement('label') : false);
                                var newValueId = rootNode.id + '_' + VALUE_ID_PREFIX + (i++);
                                if (!!newLabel) {
                                    newLabel.id = 'label_' + newValueId
                                    newLabel.textContent = val.label;
                                    newLabel.for = newValueId;
                                    rootNode.insertBefore(newLabel, addSubEntry); 
                                }

                                 // Create the hidden input that points to this subentry.
                                 var newInput = d.createElement('input');
                                 newInput.id = newValueId;
                                 newInput.type = 'hidden';
                                 newInput.name = newValueId;
                                 newInput.dataset.key = val.key;
                                 rootNode.insertBefore(newInput, addSubEntry);
                                
                                // Add the subentry to the <div>.
                                var addedSubentryId = addEntry(val.values, rootNode, true, newValueId);
                                newInput.value = addedSubentryId;

                                // Unhide all the subentries' delete buttons in the section.
                                var deleteButtons = div.parentNode.querySelectorAll(':scope button.' + DELETE_BUTTON_CLASS);
                                deleteButtons.forEach(function showButton(dButton) {
                                    if (dButton.parentNode.className === SUB_ENTRY_CLASS) {
                                        dButton.style.display = '';
                                    }
                                });
                            });
                        })(doc, div, value, subEntryId);
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
            var deleteButton = doc.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.className = DELETE_BUTTON_CLASS;
            deleteButton.addEventListener('click', function onDeleteButtonClick() {
                // Remove the subentry title (like 'actions'), then the hidden input
                // for the subentry, then the subentry itself.
                if (div.previousSibling.value === div.id) {
                    div.previousSibling.previousSibling.remove();
                    div.previousElementSibling.remove();
                }
                div.remove();

                // If there is only 1 subentry left, find it and hide its delete button.
                // otherwise, show all the subentries' delete buttons.
                var remainingSubentries = section.querySelectorAll(':scope div.' + SUB_ENTRY_CLASS);
                if (remainingSubentries.length === 1) {
                    var deleteButton = remainingSubentries[0].querySelector(':scope button.' + DELETE_BUTTON_CLASS);
                    deleteButton.style.display = 'none';
                }
            });
            
            // append the delete button.
            div.appendChild(deleteButton);
        }

        // Add the new entry to the section, optionally before a reference node, or 
        // just add it to the end of the doc if no section was given.
        if (!!section) {
            if (!!insertionRefNodeId) {
                section.insertBefore(div, doc.getElementById(insertionRefNodeId));
            }
            else {
                section.appendChild(div);
            }
        }
        else {
            doc.body.appendChild(div);
        }

        // return the new entry's id.
        return div.id;
    }


    /**
     * Add form fields for the config values.
     */
    me.insertConfigEntry = function insertConfigEntry(configEntry) {
        var entryId = addEntry(configEntry, SECTION_ELEMENTS.CONFIG);
        return entryId;
    };


    /**
     * Add form fields for a single message.
     */
    me.insertMessageEntry = function insertMessageEntry(messageEntry) {
        var entryId = addEntry(messageEntry, SECTION_ELEMENTS.MESSAGES);
        return entryId;
    };


    /**
     * Add populated form fields for a single processing.
     */
    me.insertProcessingEntry = function insertProcessingEntry(processingEntry) {
        var entryId = addEntry(processingEntry, SECTION_ELEMENTS.PROCESSINGS);
        return entryId;
    };


    /**
     * Add populated form fields for a single blessing.
     */
    me.insertBlessingEntry = function insertBlessingEntry(blessingEntry) {
        var entryId = addEntry(blessingEntry, SECTION_ELEMENTS.BLESSINGS);
        return entryId;
    };


    /**
     * Get a serialized object for a single options entry from a particular section
     * of the options form.
     * 
     * @param {*} root The root element for the section containing the entry.
     */
    function getEntry(root) {
        var entry = {};
        var textInputs = [];
        var hiddenInputs = [];

        // Sort out the text inputs and hidden inputs.
        root.childNodes.forEach(function sortInputs(child) {
            if (child.nodeName === 'INPUT') {
                if (child.type === 'text') {
                    textInputs.push(child);
                }
                else if (child.type === 'hidden') {
                    hiddenInputs.push(child);
                }
            }
        });

        textInputs.forEach(function addToConfig(input) {
            if (input.dataset.key) {
                entry[input.dataset.key] = input.value;
            }
        });

        hiddenInputs.forEach(function getSubEntry(input) {
            if (input.dataset.key) {
                if (!(input.dataset.key in entry)) {
                    entry[input.dataset.key] = [];
                }
                else if (!Array.isArray(entry[input.dataset.key])) {
                    entry[input.dataset.key] = [ entry[input.dataset.key] ];
                }

                var subEntry = input.nextSibling;
                if (!!subEntry && subEntry.className === SUB_ENTRY_CLASS) {
                    entry[input.dataset.key].push(getEntry(subEntry));
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
    function getEntries(section) {
        var entries = [];
        var divs = [];
        
        section.childNodes.forEach(function sortOutEntryDivs(child) {
            if (child.nodeName === 'DIV' && child.className === ENTRY_CLASS) {
                divs.push(child);
            }
        });

        divs.forEach(function addEachEntry(div) {
            entries.push(getEntry(div));
        });

        return entries;
    }


    /**
     * Return the object representing the config section of the options form.
     */
    me.getConfig = function getConfig() {
        return getEntry(SECTION_ELEMENTS.CONFIG);
    };

    
    /**
     * Return the serialized array of messages from the options form.
     */
    me.getMessageEntries = function getMessageEntries() {
        return getEntries(SECTION_ELEMENTS.MESSAGES);
    };


    /**
     * Return the serialized array of processings from the options form.
     */
    me.getProcessingEntries = function getProcessingEntries() {
        return getEntries(SECTION_ELEMENTS.PROCESSINGS);
    };


    /**
     * Return the serialized array of blessings from the options form.
     */
    me.getBlessingEntries = function getBlessingEntries() {
        return getEntries(SECTION_ELEMENTS.BLESSINGS);
    };


    return me;
})(window.document, Constance);


/**
 * Singleton which handles getting, setting, and processing the options spec values
 * to/from storage.
 */
var Optionator = (function Optionator(doc, dmx, C) {
    // The returned object. Merely the tracking ids of the form elements.
    var me = {
        ids: {
            CONFIG: [],
            MESSAGES: [],
            PROCESSINGS: [],
            BLESSINGS: [],
        },
    };

    // Enumeration of the DOM insertion functions.
    var INSERT_FUNCS = {
        CONFIG: dmx.insertConfigEntry,
        MESSAGES: dmx.insertMessageEntry,
        PROCESSINGS: dmx.insertProcessingEntry,
        BLESSINGS: dmx.insertBlessingEntry,
    };


    /**
     * Get the options from storage, if they're there. Use the default spec
     * if nothing is in storage yet.
     */
    function getSpec() {
        chrome.storage.sync.get({
                spec: C.DEFAULT_SPEC
            }, 
            function storageRetrieved(store) {
                layoutConfig(store.spec.config);
                layoutMessages(store.spec.messages);
                layoutProcessings(store.spec.processings);
                layoutBlessings(store.spec.blessings);
            }
        );
    }


    /**
     * Set the values typed into the textarea. If it does not parse, then 
     * say so in the status and do not actually set.
     */
    function setSpec() {
        var spec = {};

        spec.config = dmx.getConfig();
        spec.messages = dmx.getMessageEntries();
        spec.processings = dmx.getProcessingEntries();
        spec.blessings = dmx.getBlessingEntries();

        console.log('Trying to set spec:');
        console.log(JSON.stringify(spec));
        console.log('\n');

        chrome.storage.sync.set({
                spec: spec,
            },
            function storageSet() {
                var statusDiv = doc.getElementById('status');
                statusDiv.style.display = 'block';

                setTimeout(function clearMessage() {
                    statusDiv.style.display = 'none';
                }, 5000);
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
    function layoutSpecSection(section, objects) {
        // For each of the section objects, process and lay it out.
        objects.forEach(function createObjectEntry(obj) {
            var objEntry = [];

            // For each key/value pair in the section object, add it to the objEntry.
            Object.keys(obj).forEach(function processObjectValue(key) {
                // Some values are arrays of objects. Process them into arrays of label,
                // text, key sets. 
                if (Array.isArray(obj[key])) {
                    // For each of the subarray objects, process it.
                    obj[key].forEach(function addSubObjectValue(subObj) {
                        var subValues = [];
                        
                        // Similarly to the main forEach(), process each subobject key/value pair.
                        // (Could probably be recursive here.)
                        Object.keys(subObj).forEach(function processSubObjValue(subKey) {
                            var subLabel = (C.LABELS[section][key + '_' + subKey] || '');
                            var subText = (subObj[subKey] || '');

                            subValues.push({
                                label: subLabel,
                                text: subText,
                                key: subKey,
                            });
                        });

                        // Add the values array to the object entry.
                        objEntry.push({
                            label: C.LABELS[section][key],
                            values: subValues,
                            key: key,
                        });
                    });
                }
                // Scalar values are simpler. Just process out their label, text, and key. 
                // Then put them in the object entry.
                else {
                    var label = (C.LABELS[section][key] || '');
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
            var entryId = INSERT_FUNCS[section](objEntry);
            me.ids[section].push(entryId);
        });
    }


    /**
     * Create and populate the fields for spec.config. This is a single object
     * full of one-off configuration properties.
     */
    function layoutConfig(config) {
        layoutSpecSection(C.SECTIONS.CONFIG, [config]);
    }


    /**
     * Create and populate the fields for spec.messages. This is an array of objects,
     * each of which contains keys for how the content-script can identify thumb, src,
     * link, and href values for a gallery item on a page that matches the "match" key's
     * regular expression.
     */
    function layoutMessages(messages) {
        layoutSpecSection(C.SECTIONS.MESSAGES, messages);
    }


    /**
     * Create and populate the fields for spec.processings. This is an array of objects,
     * each of which contains keys for how the Logicker should do post-processing on 
     * the content-script's galleryMap. Each holds a "match" regexp for the uri, "doDig", 
     * "doScrape", and array of "actions" of varying types.
     */
    function layoutProcessings(processings) {
        layoutSpecSection(C.SECTIONS.PROCESSINGS, processings);
    }


    /**
     * Create and populate the fields for spec.blessings. This is an array of objects, each
     * of which contains keys for how the Logicker can identify a zoom-item on a zoom-page for
     * a gallery item. Each holds a "match" regexp for the uri, and a css selector "zoom" for
     * the zoom item, and a "src" prop for the direct link to the resource.
     */
    function layoutBlessings(blessings) {
        layoutSpecSection(C.SECTIONS.BLESSINGS, blessings);
    }


    // Do setup on DOMContentLoaded.
    doc.addEventListener('DOMContentLoaded', function onDomContentLoaded() {
        // Load the spec from storage, and trigger the layout.
        getSpec();

        // Hook up the event handlers for each section's "Add" button on DOMContentLoaded.
        doc.querySelectorAll('button.addEntry').forEach(function addNewEntry(button) {
            button.addEventListener('click', function addNewEntry() {
                var section = button.parentElement.id;
                layoutSpecSection(C.SECTIONS[section], C.DEFAULT_SPEC[section.toLowerCase()]);
            });
        });

        // Hook up the "set" button.
        doc.getElementById('set').addEventListener('click', setSpec);
    });

   
    return me;
})(window.document, Dominatrix, Constance);