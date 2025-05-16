let settings = {
    active: false,
    autoStart: true,
    pipMode: false,
    highContrast: false
};

let avatarDiv = null; //Will hold actual box element displayed on screen
let isAvatarDisplayed = false; //Remembers if avatar is currently showing(starts as 'no')

document.addEventListener('signAvatarSettingsChanged', (event) => {
    settings = event.detail;

    if (settings.active && !isAvatarDisplayed) {
        createAvatar();
    } else if (!settings.active && isAvatarDisplayed) {
        removeAvatar();
    }

    //Will apply visual settings if avatar exists
    if (avatarDiv) {
        applyAvatarStyles();
    }
});

//Initializes after the page loads
function initialize() {
    //Helps to see if we are on a YouTube video page
    const videoId = new URLSearchParams(window.location.search).get("v");
    if (!videoId) return;

    chrome.storage.sync.get({
        active: false,
        autoStart: true,
        pipMode: false,
        highContrast: false
    }, (items)=> {
        settings = items;

        //This will create avatar if both auto-start and extension is active
        if (settings.active && settings.autoStart) {
            createAvatar();
        }

        setUpPipObserver();
    });
}

async function createAvatar() {
    if (isAvatarDisplayed) return;
    //Makes sure there's a YouTube video ID in the URL
    const videoId = new URLSearchParams(window.location.search).get("v");
    try {
        avatarDiv = document.createElement("div");
        avatarDiv.id = 'sign-avatar-cc';
        avatarDiv.style.position = 'fixed';//Ensures that it remains fixed even when scrolling
        avatarDiv.style.bottom = '80px';
        avatarDiv.style.right = '20px';
        avatarDiv.style.background= "rgba(255,255,255,0.9)";
        avatarDiv.style.padding= '15px';
        avatarDiv.style.borderRadius = '8px';
        avatarDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.30)';
        avatarDiv.style.zIndex = '9999';//Ensures that the cc remains on top of everything
        avatarDiv.style.maxWidth = '250px';
        avatarDiv.style.transition = 'all 0.2s ease';

        //Indicator to show that it is loading
        avatarDiv.innerHTML = `<div style= 'display: flex; align-items: center;'>
            <span style = 'font-weight: bold; margin-right: 10px;'>Sign CC</span>
            <div class = 'loading-spinner' style='width: 16px; height: 16px; border: 2px solid #ccc;
            border-top-color: #2d72d9; border-radius: 50%; animation: spin 1s linear infinite;'></div>
        </div>
        <p style='margin-top: 10px; font-size: 16px;'>Loading Sign CC</p>`;

        const style = document.createElement('style');
        style.textContent = `
        @keyframes spin{
            to{transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);//Ensures that any element on the page can use the spin animation
    document.body.appendChild(avatarDiv);//This attaches the CC box onto the page
    isAvatarDisplayed = true;

    applyAvatarStyles();
    //To add to this later, for now a random localhost
    const response = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({videoId})
    });
    if (!response.ok){
        throw new Error('Server Error: ${response.status}');
    }
    const data = await response.json()
    //After loading transcript data, will be replaced with the actual content
    if (avatarDiv){
        avatarDiv.innerHTML = `
        <div style='display': flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;'>
            <span style='font-weight: bold;'>Sign CC</span>
            <button id ='avatar-close' style = 'background: none;
            border: none; cursor: pointer; font-size: 16px;'>times</button>
        </div>
        <div style = 'max-height: 200px; overflow-y: auto;'>
         ${data.transcript ||'Transcript is unavailable'}
        </div>
        `;

        document.getElementById('close-avatar').addEventListener('click', ()=> {
            removeAvatar();
            settings.active = false;
            chrome.storage.sync.set({active: false});
        });
    }
    } catch (error) {
        console.error("There was a problem with the CC:", error);
    
    //Error message if there is a problem
    if (avatarDiv) {
        avatarDiv.innerHTML = `
        <div style='display': flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;'>
            <span style='font-weight: bold;'>Sign CC</span>
            <button id ='avatar-close' style = 'background: none;
            border: none; cursor: pointer; font-size: 16px;'>times</button>
        </div>
        <p style='color: red; margin-top: 10px;'>Sign language loading failed. Try again.</p>
     `;
     document.getElementsById('close-avatar').addEventListener('click', removeAvatar);

    }
}
}

function removeAvatar() {
    if (avatarDiv) {
        avatarDiv.remove();
        avatarDiv = null;
        isAvatarDisplayed = false;
    }
}

function applyAvatarStyles() {
    if (!avatarDiv) return;

    //Activates high contrast if user sets it
    if (settings.highContrast){
        avatarDiv.style.background = '#000000';
        avatarDiv.style.color = '#ffffff';
        avatarDiv.style.border = '2px solid #ffffff';
    } else{
        avatarDiv.style.background = 'rgba(255,255,255,0.9)';
        avatarDiv.style.color = '#000000';
        avatarDiv.style.border = 'none';
    }
}

function setUpPipObserver(){
    //For now it only logs info need to add more codes for it to work
    document.addEventListener('enterpictureinpicture', (event) => {
        if (settings.pipMode && settings.active) {
            const pipWindow = event.pictureInPictureWindow;
            console.log("In PiP Mode, size:", pipWindow.width, pipWindow.height);
        }
    });
    document.addEventListener('leavepictureinpicture', () => {
        console.log("Exited PiP Mode");
    });
}

function makeAvatarDraggable() {
    if (!avatarDiv) return;

    let isDragging = false;
    let offsetX, offsetY;
    //Need to add a draggable header to create a draggable area
    const header = document.createElement('div');
    header.style.cursor = 'move';
    header.style.padding = '5px';
    header.style.marginBottom = '5px';
    header.addEventListener('mousedown', (e)=>{
        isDragging = true;
        offsetX = e.clientX - avatarDiv.getBoundingClientRect().left;//Offsets mouse position and top-left corner of avatar
        offsetY = e.clientY - avatarDiv.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', (e)=>{
        if (!isDragging) return;
        avatarDiv.style.left = (e.clientX - offsetX) + 'px';
        avatarDiv.style.right = 'auto';
        avatarDiv.style.top = (e.clientY - offsetY) + 'px';
        avatarDiv.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', ()=>{
        isDragging = false;
    });
    avatarDiv.prepend(header);//Adds header as 1st child of avatarDiv and handles both cases to see if avatarDiv has children
}

initialize();
let lastURL = location.href;
new MutationObserver(()=>{
    if (location.href !== lastURL){
        lastURL = location.href;
        setTimeout(initialize,1000);
    }
}).observe(document, {subtree:true, childList:true});






    