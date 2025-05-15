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
        avatarDiv.style.boxShadow = '0 4px '


    }
}

    