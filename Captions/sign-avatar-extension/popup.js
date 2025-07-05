const activateBtn = document.getElementById('activate');
const activateToggle = document.getElementById('activateToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const customizeBtn = document.getElementById('customize');
const autoStartToggle = document.getElementById('autoStart');
const pipModeToggle = document.getElementById('pipMode');
const highContrastToggle = document.getElementById('highContrast');

let extensionActive = false;

function updateUI(isActive) {
    extensionActive = isActive;
    activateToggle.checked = isActive;

    if (isActive) {
        statusDot.classList.add('active');
        statusText.textContent = 'Active';
        activateBtn.innerHTML = 'Intepreter Running';
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'Inactive';
        activateBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Start Interpreter';
    //innerHTML is used to get or set the HTML content inside an element by directly changing the HTML
    }
}

function saveSettings() {
    //chrome.storage.sync allows us to save data that remains even if browser is clsoed
    //chrome reads state of switches, packages these into objects, and then store these in sync storage
    chrome.storage.sync.get({
        active: extensionActive,
        autoStart: autoStartToggle.checked,
        pipMode: pipModeToggle.checked,
        hightContrast: highContrastToggle.checked
    });
}

function loadSettings() {
    chrome.storage.sync.get({
        active: false,
        autoStart: true,
        pipMode: false,
        hightContrast: false
    }, (items)=>{
        autoStartToggle.checked = items.autoStart;
        pipModeToggle.checked = items.pipMode;
        highContrastToggle.checked = items.hightContrast;
        //Anonymous callback function receives retrieved settings in the items parameter
        //Merges any saved settings from storage with default values provided
        updateUI(items.active);
    });
}

async function toggleExtension(activate) {
    //Uses Chrome Extension API to find the current tab that is active in current window
    //parameters used to specify we want active tab and active window, with result
    //destructured with [tab] to get 1st and only tab that matches these criteria
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true})

    try{
        updateUI(activate);//Updates interface immediately b4 slower operation of injecting script
        
        //target specifies tab where script will be injected
        //func specifies which function to run in page context
        //args passes 4 arguments, whether intepreter should be activated, and if the other features are enabled
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: injectSettings,
            args: [activate, autoStartToggle.checked, pipModeToggle.checked, highContrastToggle.checked]
        });

        saveSettings();
    } catch (error) {
        console.error("Error with executing script: ", error);
        updateUI(!activate);
    }
}

//serves as a bridge between extension popup interface and actual webpage where sign language avatar appears
//Also note that this function runs in a completely different context and runs directly in context of webpage
function injectSettings(isActive, autoStart, pipMode, highContrast) {
    window.signAvatarSettings = {
        active: isActive,
        autoStart: autoStart,
        pipMode: pipMode,
        highContrast: highContrast
    };

    //CustomEvent notifies other parts of the app about something that just happened
    //This dispatches event, which contains all the settings,  on the document object of the webpage
    document.dispatchEvent(new CustomEvent('signAvatarSettingsChanged', {
        detail: window.signAvatarSettings
    }));

    return true;
}

//Attaches a click event listener that calls toggleExtension and does the opp of current extension state
activateBtn.addEventListener('click', async ()=> {
    await toggleExtension(!extensionActive);
});

activateToggle.addEventListener('change', async ()=> {
    await toggleExtension(activateToggle.checked);
});

//Will create a new tab that allows users to access more advanced customizable options
//Need to link this up with the frontend website
customizeBtn.addEventListener('click', ()=>{
    chrome.tabs.create({url: 'customize.html'});
});

autoStartToggle.addEventListener('change', saveSettings);
pipModeToggle.addEventListener('change', saveSettings);
highContrastToggle.addEventListener('change', saveSettings);

//This fires when the HTML document has been completely loaded-> Ensures user preferences loaded and applied
document.addEventListener('DOMContentLoaded', loadSettings);
