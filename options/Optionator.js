import { default as C } from '../lib/C.js';
import { OptionEntry } from '../lib/DataClasses.js';
import { default as CommonStaticBase } from '../lib/CommonStaticBase.js';
import { default as Utils } from '../background/Utils.js';
import { default as Dominatrix } from './Dominatrix.js';

 
/**
 * Static class which handles getting, setting, and processing the options spec values
 * to/from storage.
 */
class Optionator extends CommonStaticBase {
    // id properties of the elements in the configuration sections
    static Ids = {
        CONFIG: [],
        MESSAGES: [],
        PROCESSINGS: [],
        BLESSINGS: [],
    };

    // Enumeration of the DOM insertion functions.
    static InsertionFunctions = {
        CONFIG: Dominatrix.insertConfigEntry,
        MESSAGES: Dominatrix.insertMessageEntry,
        PROCESSINGS: Dominatrix.insertProcessingEntry,
        BLESSINGS: Dominatrix.insertBlessingEntry,
    };


    /**
     * Setup the Log, and a STOP listener event handler.
     */
    static setup() {
        if (!Utils.exists(Optionator.log)) {
            super.setup(C.LOG_SRC.OPTIONATOR);
        }
    }


    /**
     * Get the options from storage, if they're there. Use the default spec
     * if nothing is in storage yet.
     */
    static getSpec() {
        var loadingDiv = document.getElementById('loading');

        if (!!loadingDiv) {
            loadingDiv.style.display = C.CSS_V.DISPLAY.BLOCK;
        }

        chrome.storage.sync.get({
                spec: C.OPT_CONF.DEFAULT_SPEC
            }, 
            (store) => {
                Optionator.layoutConfig(store.spec.config);
                Optionator.layoutMessages(store.spec.messages);
                Optionator.layoutProcessings(store.spec.processings);
                Optionator.layoutBlessings(store.spec.blessings);

                if (!!loadingDiv) {
                    loadingDiv.style.display = C.CSS_V.DISPLAY.NONE;
                }
            }
        );
    }


    /**
     * Set the values typed into the textarea. If it does not parse, then 
     * say so in the status and do not actually set.
     */
    static setSpec() {
        var spec = {};

        spec.config = Dominatrix.getConfig();
        spec.messages = Dominatrix.getMessageEntries();
        spec.processings = Dominatrix.getProcessingEntries();
        spec.blessings = Dominatrix.getBlessingEntries();

        // Note: use of static "this". 
        this.lm('Trying to set spec:');
        this.lm(JSON.stringify(spec));
        this.lm('\n');

        chrome.storage.sync.set({
                spec: spec,
            },
            () => {
                var statusDiv = document.getElementById('status');
                statusDiv.style.display = 'block';

                setTimeout(() => {
                    statusDiv.style.display = C.CSS_V.DISPLAY.NONE;
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
    static layoutSpecSection(section, objects) {
        // For each of the section objects, process and lay it out.
        objects.forEach((obj) => {
            var objEntry = [];

            // For each key/value pair in the section object, add it to the objEntry.
            Object.keys(obj).forEach((key) => {
                // Some values are arrays of objects. Process them into arrays of label,
                // text, key sets. 
                if (Array.isArray(obj[key])) {
                    // For each of the subarray objects, process it.
                    obj[key].forEach((subObj) => {
                        var subValues = [];
                        
                        // Similarly to the main forEach(), process each subobject key/value pair.
                        // (Could probably be recursive here.)
                        Object.keys(subObj).forEach((subKey) => {
                            var subLabel = (C.OPT_CONF.LABELS[section][key + '_' + subKey] || C.ST.E);
                            var subText = (subObj[subKey] || C.ST.E);

                            subValues.push(
                                new OptionEntry(subLabel, subText, subKey)
                            );
                        });

                        // Add the values array to the object entry.
                        objEntry.push(
                            new OptionEntry(C.OPT_CONF.LABELS[section][key], subValues, key)
                        );
                    });
                }
                // Scalar values are simpler. Just process out their label, text, and key. 
                // Then put them in the object entry.
                else {
                    var label = (C.OPT_CONF.LABELS[section][key] || C.ST.E);
                    var text = (obj[key] || C.ST.E);

                    var valueObj = new OptionEntry(label, text, key);

                    if (key === 'match') {
                        objEntry.splice(0,0,valueObj);
                    }
                    else {
                        objEntry.splice(-2,0,valueObj);
                    }
                }
            });

            // Call the proper Dominatrix layout function, and add the id to our tracking object.
            var entryId = Optionator.InsertionFunctions[section](objEntry);
            Optionator.Ids[section].push(entryId);
        });
    }


    /**
     * Create and populate the fields for spec.config. This is a single object
     * full of one-off configuration properties.
     */
    static layoutConfig(config) {
        Optionator.layoutSpecSection(C.OPT_CONF.SECTIONS.CONFIG, [config]);
    }


    /**
     * Create and populate the fields for spec.messages. This is an array of objects,
     * each of which contains keys for how the content-script can identify thumb, src,
     * link, and href values for a gallery item on a page that matches the "match" key's
     * regular expression.
     */
    static layoutMessages(messages) {
        Optionator.layoutSpecSection(C.OPT_CONF.SECTIONS.MESSAGES, messages);
    }


    /**
     * Create and populate the fields for spec.processings. This is an array of objects,
     * each of which contains keys for how the Logicker should do post-processing on 
     * the content-script's galleryMap. Each holds a "match" regexp for the uri, "doDig", 
     * "doScrape", and array of "actions" of varying types.
     */
    static layoutProcessings(processings) {
        Optionator.layoutSpecSection(C.OPT_CONF.SECTIONS.PROCESSINGS, processings);
    }


    /**
     * Create and populate the fields for spec.blessings. This is an array of objects, each
     * of which contains keys for how the Logicker can identify a zoom-item on a zoom-page for
     * a gallery item. Each holds a "match" regexp for the uri, and a css selector "zoom" for
     * the zoom item, and a "src" prop for the direct link to the resource.
     */
    static layoutBlessings(blessings) {
        Optionator.layoutSpecSection(C.OPT_CONF.SECTIONS.BLESSINGS, blessings);
    }


    /**
     * Set up the event listener which kicks off building the Options page on
     * 'DOMContentLoaded'.
     */
    static buildOptionsPageUi() {
        // Do setup on DOMContentLoaded.
        document.addEventListener(C.EVT.DOMCL, () => {
            // Load the spec from storage, and trigger the layout.
            Optionator.getSpec();

            // Hook up the event handlers for each section's "Add" button on DOMContentLoaded.
            document.querySelectorAll('button.addEntry').forEach((button) => {
                button.addEventListener(C.EVT.CLICK, () => {
                    var section = button.parentElement.id;
                    Optionator.layoutSpecSection(
                        C.OPT_CONF.SECTIONS[section], 
                        C.OPT_CONF.DEFAULT_SPEC[section.toLowerCase()]
                    );
                });
            });

            // Hook up the "set" button.
            document.getElementById('set').addEventListener(C.EVT.CLICK, () => { 
                Optionator.setSpec(); 
            });
        });
    }

    static getDefaultConfig() {
        return C.OPT_CONF.DEFAULT_SPEC.config;
    }

    static getHalfBakedEnablingValue() {
        return C.OPT_CONF.HALF_BAKED_VAL;
    }
}
Optionator.setup();

// Set the class on the background window just in case.
if (Utils.isOptionsPage(window) && !window.hasOwnProperty(C.WIN_PROP.OPTIONATOR_CLASS)) {
    window[C.WIN_PROP.OPTIONATOR_CLASS] = Optionator;

    // Add handler to set up the Options document on DOMContentLoaded.
    Optionator.buildOptionsPageUi();
}

// Export.
export { Optionator as default };


