import { default as C } from '../lib/C.js';
import { OptionEntry } from '../lib/DataClasses.js';
import { default as CommonStaticBase } from '../lib/CommonStaticBase.js';
import { default as Utils } from '../background/Utils.js';


/*
 * Singleton which handles layout and serialization to and from the HTML5 form
 * for the options spec values.
 */
class Dominatrix extends CommonStaticBase { 
    // Key for the static class reference on the options page window object.  
    static ST_KEY = C.WIN_PROP.DOMINATRIX_ST;

    // Counters used in creating unique element ids.
    static EntryCounter = 0;
    static SubEntryCounter = 0;

    // Enumeration of section holder <div>s that exist on the options form page.
    static SectionElements = {
        CONFIG: document.getElementById(C.OPT_CONF.SECTIONS.CONFIG),
        MESSAGES: document.getElementById(C.OPT_CONF.SECTIONS.MESSAGES),
        PROCESSINGS: document.getElementById(C.OPT_CONF.SECTIONS.PROCESSINGS),
        BLESSINGS: document.getElementById(C.OPT_CONF.SECTIONS.BLESSINGS),
    };


    /**
     * Set up the Logger and STOP handlers.
     */
    static setup() {
        if (!Utils.exists(Dominatrix.log)) {
            super.setup(C.LOG_SRC.DOMINATRIX);
        }
    }


    /**
     * Add one object entry of an options section to the HTML5 form.
     * 
     * @param {OptionEntry[]} values Array of OptionEntry objects which describe the entry.
     * @param {HTMLElement} section Section of the options spec the entry belongs to.
     * @param {boolean} isSubEntry Flag used for recursion.
     * @param {Node} insertionRefNode DOM node before which to insert the entry.
     */
    static addEntry(values, section, isSubEntry, insertionRefNodeId) {
        var div = document.createElement(C.SEL_PROP.DIV);

        if (isSubEntry) {
            div.id = C.DX_CONF.SUB_ENTRY_DIV_PREFIX + (Dominatrix.SubEntryCounter++);
            div.className = C.DX_CONF.SUB_ENTRY_CLASS;
        }
        else {
            div.id = C.DX_CONF.ENTRY_DIV_PREFIX + (Dominatrix.EntryCounter++);
            div.className = C.DX_CONF.ENTRY_CLASS;
        }

        if (Array.isArray(values)) {
            for (var i = 0; i < values.length; i++) {
                var value = values[i];

                if (!value) {
                    continue;
                }

                var label = (!!value.label ? document.createElement(C.SEL_PROP.LABEL) : false);
                var valueId = div.id + C.ST.U + C.DX_CONF.VALUE_PREFIX + i;

                // Create and append the label if we were told to label this.
                if (Utils.exists(label)) {
                    label.textContent = value.label;
                    label.for = valueId;
                    div.appendChild(label);
                }

                // Create the input that represents the value.
                var input = document.createElement(C.SEL_PROP.INPUT);
                input.id = valueId;
                input.name = valueId;
                input.dataset.key = value.key;
                div.appendChild(input);                

                //Dominatrix.lm(`--\nLabel: ${label}\nValue: ${JSON.stringify(value)}`);

                var inputValue = C.ST.E;

                // For array values, "text" is a misnomer, and actually is an array 
                // of this OptionEntry's own sublist of OptionEntry prefs. We Build it out
                // recursively.
                if (Array.isArray(value.text)) {
                    // Now recurse to add the subentry values.
                    var subEntryId = Dominatrix.addEntry(value.text, div, true);
                    input.type = C.SEL_PROP.HIDDEN;                    
                    inputValue = subEntryId;
                    
                    // Hook up the addSubEntry button to add new subentries. Only place the
                    // button after the last subentry value in the array. 
                    if ((i+1) === values.length || values[i+1].key !== value.key) {
                        Dominatrix.buildAddSubEntryButton(i, div, value.text, subEntryId);
                        i++;
                    }
                }
                // For scalar "text" values, use value.text directly as the inputValue, or fallback 
                // to a 
                else {
                    input.type = 'text';                    
                    inputValue = Utils.asString(
                        ('text' in value) ? value.text : value
                    );
                }
                input.value = inputValue;
            }

            // Create a delete button for the entry/subentry. If we're dealing with the first
            // subentry of a list of subentries, do not create a delete button for it.
            var deleteButton = document.createElement('button');
            deleteButton.textContent = C.DX_CONF.DELETE_BUTTON_TEXT;
            deleteButton.className = C.DX_CONF.DELETE_BUTTON_CLASS;
            deleteButton.addEventListener(C.EVT.CLICK, () => {
                // Remove the subentry title (like 'actions'), then the hidden input
                // for the subentry, then the subentry itself.
                if (div.previousSibling.value === div.id) {
                    div.previousSibling.previousSibling.remove();
                    div.previousElementSibling.remove();
                }
                div.remove();

                // If there is only 1 subentry left, find it and hide its delete button.
                // otherwise, show all the subentries' delete buttons.
                var remainingSubentries = section.querySelectorAll(C.DX_CONF.SCOPE_DIV_D_SUBENTRY_SEL);
                if (remainingSubentries.length === 1) {
                    var deleteButton = remainingSubentries[0].querySelector(C.DX_CONF.SCOPE_BUTTON_D_DELETE_BUTTON_SEL);
                    deleteButton.style.display = C.CSS_V.DISPLAY.NONE;
                }
            });
            
            // append the delete button.
            div.appendChild(deleteButton);
        }

        // Add the new entry to the section, optionally before a reference node, or 
        // just add it to the end of the doc if no section was given.
        if (!!section) {
            if (!!insertionRefNodeId) {
                section.insertBefore(div, document.getElementById(insertionRefNodeId));
            }
            else {
                section.appendChild(div);
            }
        }
        else {
            document.body.appendChild(div);
        }

        // return the new entry's id.
        return div.id;
    }


    /**
     * Create button on page to add a sub entry to a config secion on the options page.\
     * 
     * @param {Node} rootNode - Element holding node for this section
     * @param {object} val - object descriptor, key-value label->values pair.
     * @param {string} refEntryId - 
     */
    static buildAddSubEntryButton(idx, rootNode, val, refEntryId) {  
        var refNode = document.getElementById(refEntryId);

        // Build the 'add subentry' button, and insert it into the <div>.
        var addSubEntry = document.createElement('button');
        addSubEntry.id = C.DX_CONF.ADD_SUB_ENTRY_PREFIX + idx;
        addSubEntry.className = C.DX_CONF.ADD_SUB_ENTRY_CLASS;
        addSubEntry.textContent = 'add subentry';
        rootNode.insertBefore(addSubEntry, refNode);                                                

        // Create the 'add subentry' click handler. It creates a new label for the 
        // subentry section, adds the subentry by copying an existing subentry's values,
        // and creates the needed hidden element that points to it.
        addSubEntry.addEventListener('click', () => {
            // Create the label.
            var newLabel = (!!val.label ? document.createElement('label') : false);
            var newValueId = div.id + '_' + C.DX_CONF.VALUE_PREFIX + (idx + 1);
            if (!!newLabel) {
                newLabel.id = 'label_' + newValueId
                newLabel.textContent = val.label;
                newLabel.for = newValueId;
                rootNode.insertBefore(newLabel, addSubEntry); 
            }

            // Create the hidden input that points to this subentry.
            var newInput = document.createElement('input');
            newInput.id = newValueId;
            newInput.type = 'hidden';
            newInput.name = newValueId;
            newInput.dataset.key = val.key;
            rootNode.insertBefore(newInput, addSubEntry);
            
            // Add the subentry to the <div>.
            var addedSubentryId = Dominatrix.addEntry(val, rootNode, true, newValueId);
            newInput.value = addedSubentryId;

            // Unhide all the subentries' delete buttons in the section.
            var deleteButtons = div.parentNode.querySelectorAll(':scope button.' + C.DX_CONF.DELETE_BUTTON_CLASS);
            deleteButtons.forEach((dButton) => {
                if (dButton.parentNode.className === C.DX_CONF.SUB_ENTRY_CLASS) {
                    dButton.style.display = C.ST.E;
                }
            });
        });
    }


    /**
     * Add form fields for the config values.
     */
    static insertConfigEntry(configEntry) {
        var entryId = Dominatrix.addEntry(configEntry, Dominatrix.SectionElements.CONFIG);
        return entryId;
    }


    /**
     * Add form fields for a single message.
     */
    static insertMessageEntry(messageEntry) {
        var entryId = Dominatrix.addEntry(messageEntry, Dominatrix.SectionElements.MESSAGES);
        return entryId;
    }


    /**
     * Add populated form fields for a single processing.
     */
    static insertProcessingEntry(processingEntry) {
        var entryId = Dominatrix.addEntry(processingEntry, Dominatrix.SectionElements.PROCESSINGS);
        return entryId;
    }


    /**
     * Add populated form fields for a single blessing.
     */
    static insertBlessingEntry(blessingEntry) {
        var entryId = Dominatrix.addEntry(blessingEntry, Dominatrix.SectionElements.BLESSINGS);
        return entryId;
    }


    /**
     * Get a serialized object for a single options entry from a particular section
     * of the options form.
     * 
     * @param {*} root The root element for the section containing the entry.
     */
    static getEntry(root) {
        var entry = {};
        var textInputs = [];
        var hiddenInputs = [];

        // Sort out the text inputs and hidden inputs.
        root.childNodes.forEach((child) => {
            if (child.nodeName.toLowerCase() === 'input') {
                if (child.type === 'text') {
                    textInputs.push(child);
                }
                else if (child.type === 'hidden') {
                    hiddenInputs.push(child);
                }
            }
        });

        textInputs.forEach((input) => {
            if (input.dataset.key) {
                entry[input.dataset.key] = input.value;
            }
        });

        hiddenInputs.forEach((input) => {
            if (input.dataset.key) {
                if (!(input.dataset.key in entry)) {
                    entry[input.dataset.key] = [];
                }
                else if (!Array.isArray(entry[input.dataset.key])) {
                    entry[input.dataset.key] = [ entry[input.dataset.key] ];
                }

                var subEntry = input.nextSibling;
                if (!!subEntry && subEntry.className === C.DX_CONF.SUB_ENTRY_CLASS) {
                    entry[input.dataset.key].push(Dominatrix.getEntry(subEntry));
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
    static getEntries(section) {
        var entries = [];
        var divs = [];
        
        // Get all of the div.ENTRY_CLASS dom nodes.
        section.childNodes.forEach((child) => {
            if (child.nodeName === 'DIV' && child.className === C.DX_CONF.ENTRY_CLASS) {
                divs.push(child);
            }
        });

        // Add each entry.
        divs.forEach((div) => {
            entries.push(Dominatrix.getEntry(div));
        });

        return entries;
    }


    /**
     * Return the object representing the config section of the options form.
     * Before 0.4.9, the "lastElementChild" was missing, so we never saved
     * config options. :(
     */
    static getConfig() {
        return Dominatrix.getEntry(Dominatrix.SectionElements.CONFIG.lastElementChild);
    };

    
    /**
     * Return the serialized array of messages from the options form.
     */
    static getMessageEntries() {
        return Dominatrix.getEntries(Dominatrix.SectionElements.MESSAGES);
    };


    /**
     * Return the serialized array of processings from the options form.
     */
    static getProcessingEntries() {
        return Dominatrix.getEntries(Dominatrix.SectionElements.PROCESSINGS);
    };


    /**
     * Return the serialized array of blessings from the options form.
     */
    static getBlessingEntries() {
        return Dominatrix.getEntries(Dominatrix.SectionElements.BLESSINGS);
    };
}
Dominatrix.setup();


// Set the class on the background window just in case.
if (Utils.isOptionsPage(window) && !window.hasOwnProperty(C.WIN_PROP.DOMINATRIX_CLASS)) {
    window[C.WIN_PROP.DOMINATRIX_CLASS] = Dominatrix;
}


// Export.
export { Dominatrix as default };
