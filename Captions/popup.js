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

        updateUI(items.active);
    });
}

