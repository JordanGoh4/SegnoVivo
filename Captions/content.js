let settings = {
    active: false,
    autoStart: true,
    pipMode: false,
    highContrast: false,
    showAvatar: true,
    avatarSize: 150
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
        highContrast: false,
        showAvatar: true,
        avatarSize: 150
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
    if (!videoId) return;
    
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
        avatarDiv.style.maxWidth = '350px';
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
    
    //To add to this later, for now a random localhost of say 5000
    const response = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({videoId})
    });
    
    if (!response.ok){
        throw new Error(`Server Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    //After loading transcript data, will be replaced with the actual content
    if (avatarDiv){
        avatarDiv.innerHTML = `
        <div style='display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;'>
            <span style='font-weight: bold;'>ASL Captions</span>
            <button id='close-avatar' style='background: none;
            border: none; cursor: pointer; font-size: 16px;'>×</button>
        </div>
        <div id="asl-captions-container" style='max-height: 200px; overflow-y: auto;'></div>
        `;

        const captionsContainer = document.getElementById('asl-captions-container');
        
        // Check if we have ASL segments
        if (data.asl_segments && data.asl_segments.length > 0) {
            // Process each segment
            for (const segment of data.asl_segments) {
                const captionDiv = document.createElement('div');
                captionDiv.className = 'asl-caption';
                captionDiv.style.marginBottom = '12px';
                captionDiv.style.paddingBottom = '8px';
                captionDiv.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
                
                // Format timestamp if available so that we can link cc to video audio
                let timestampHtml = '';
                if (segment.start !== undefined && segment.end !== undefined) {
                    const formatTime = (time) => {
                        const minutes = Math.floor(time / 60);
                        const seconds = Math.floor(time % 60);
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    };
                    
                    timestampHtml = `
                    <div style="font-size: 0.8em; color: #888; margin-bottom: 3px;">
                        ${formatTime(segment.start)} - ${formatTime(segment.end)}
                    </div>`;
                    
                    // Store timestamps as data attributes for sync feature
                    captionDiv.dataset.start = segment.start;
                    captionDiv.dataset.end = segment.end;
                }
                
                // Adds thre ASL gloss text
                captionDiv.innerHTML = `
                    ${timestampHtml}
                    <div class="asl-text" style="font-weight: bold; color: #2d72d9; margin-bottom: 4px; font-size: 1.1em;">
                        ${segment.asl_gloss}
                    </div>
                    <div class="english-text" style="font-size: 0.8em; color: #666; margin-bottom: 10px;">
                        ${segment.english}
                    </div>
                    <div class="sign-avatar-container" style="width: 100%; height: ${settings.avatarSize}px; border-radius: 8px; overflow: hidden; margin-top: 10px; display: none; background: #f5f5f5; position: relative;">
                        <p style="text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #888; margin: 0;">Loading sign avatar...</p>
                    </div>
                `;
                
                captionsContainer.appendChild(captionDiv);
                
                // Only generate avatar if setting is enabled
                if (settings.showAvatar) {
                    // Get the avatar container
                    const avatarContainer = captionDiv.querySelector('.sign-avatar-container');
                    avatarContainer.style.display = 'block';
                    
                    // Generate the avatar animation for this segment
                    generateAvatarForSegment(segment.asl_gloss, avatarContainer);
                }
            }
        } else {
            captionsContainer.innerHTML = '<p>ASL translation is unavailable</p>';
        }

        document.getElementById('close-avatar').addEventListener('click', ()=> {
            removeAvatar();
            settings.active = false;
            chrome.storage.sync.set({active: false});
        });
        
        // Make the caption box draggable
        makeAvatarDraggable();
        
        // Add video sync functionality
        syncCaptionsWithVideo();
    }
    } catch (error) {
        console.error("There was a problem with the CC:", error);
    
    //Error message if there is a problem
    if (avatarDiv) {
        avatarDiv.innerHTML = `
        <div style='display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;'>
            <span style='font-weight: bold;'>Sign CC</span>
            <button id='close-avatar' style='background: none;
            border: none; cursor: pointer; font-size: 16px;'>×</button>
        </div>
        <p style='color: red; margin-top: 10px;'>Sign language loading failed. Try again.</p>
     `;
     document.getElementById('close-avatar').addEventListener('click', removeAvatar);
    }
}
}

// Function to generate avatar animation for a segment
async function generateAvatarForSegment(aslGloss, containerElement) {
    try {
        // Call the backend to generate the animation
        const response = await fetch("http://localhost:5000/generate-avatar", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({asl_gloss: aslGloss})
        });
        
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.animation_url) {
            // Create video element for the animation
            const video = document.createElement('video');
            video.src = `http://localhost:5000${data.animation_url}`;
            video.controls = true;
            video.autoplay = false;
            video.loop = true;
            video.muted = true; // Start muted to avoid auto-play issues
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.borderRadius = '8px';
            video.style.objectFit = 'cover';
            
            // Clear the container and add the video
            containerElement.innerHTML = '';
            containerElement.appendChild(video);
            
            // Add play/pause functionality on click
            containerElement.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });
            
            // Add hover effect to show the users it's interactive
            containerElement.style.cursor = 'pointer';
            containerElement.addEventListener('mouseenter', () => {
                containerElement.style.opacity = '0.8';
            });
            containerElement.addEventListener('mouseleave', () => {
                containerElement.style.opacity = '1';
            });
        } else {
            containerElement.innerHTML = '<p style="text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #888; margin: 0;">Avatar generation failed</p>';
        }
    } catch (error) {
        console.error("Error generating avatar:", error);
        containerElement.innerHTML = '<p style="text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #888; margin: 0;">Avatar generation failed</p>';
    }
}

function syncCaptionsWithVideo() {
    // Find the YouTube video element
    const video = document.querySelector('video');
    if (!video || !avatarDiv) return;
    
    // Function to update visible captions based on current video time
    const updateCaptions = () => {
        const currentTime = video.currentTime;
        const captions = avatarDiv.querySelectorAll('.asl-caption');
        let foundActiveCaption = false;
        
        captions.forEach(caption => {
            // Skip captions without timestamps
            if (!caption.dataset.start || !caption.dataset.end) return;
            
            const startTime = parseFloat(caption.dataset.start);
            const endTime = parseFloat(caption.dataset.end);
            
            // Show/hide caption based on current time
            if (currentTime >= startTime && currentTime <= endTime) {
                caption.style.display = 'block';
                caption.style.backgroundColor = 'rgba(45, 114, 217, 0.1)';
                foundActiveCaption = true;
                
                // Auto-scroll to this caption
                caption.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                caption.style.display = 'block';
                caption.style.backgroundColor = 'transparent';
            }
        });
    };
    
    // Update captions on timeupdate event (fires several times per second during playback)
    video.addEventListener('timeupdate', updateCaptions);
    
    // Store the event in avatarDiv's dataset to allow cleanup later
    avatarDiv.dataset.hasTimeSync = 'true';
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
        
        // Update text colors for high contrast
        const aslTexts = avatarDiv.querySelectorAll('.asl-text');
        aslTexts.forEach(text => {
            text.style.color = '#4da6ff'; // Brighter blue for dark background
        });
    } else{
        avatarDiv.style.background = 'rgba(255,255,255,0.9)';
        avatarDiv.style.color = '#000000';
        avatarDiv.style.border = 'none';
        
        // Restore default text colors
        const aslTexts = avatarDiv.querySelectorAll('.asl-text');
        aslTexts.forEach(text => {
            text.style.color = '#2d72d9'; // Original blue
        });
    }
    
    // Apply avatar-specific settings
    const avatarContainers = avatarDiv.querySelectorAll('.sign-avatar-container');
    avatarContainers.forEach(container => {
        // Show/hide based on settings
        container.style.display = settings.showAvatar ? 'block' : 'none';
        
        // Apply size
        container.style.height = `${settings.avatarSize}px`;
    });
}

function setUpPipObserver(){
    //For now it only logs info need to add more codes for it to work
    document.addEventListener('enterpictureinpicture', (event) => {
        if (settings.pipMode && settings.active) {
            const pipWindow = event.pictureInPictureWindow;
            console.log("In PiP Mode, size:", pipWindow.width, pipWindow.height);
            
            // Adjust avatar for PiP mode
            if (avatarDiv) {
                avatarDiv.style.position = 'fixed';
                avatarDiv.style.zIndex = '2147483647'; // Highest possible z-index
                avatarDiv.style.bottom = '10px';
                avatarDiv.style.right = '10px';
                avatarDiv.style.maxWidth = '200px';
                avatarDiv.style.fontSize = '12px';
            }
        }
    });
    document.addEventListener('leavepictureinpicture', () => {
        console.log("Exited PiP Mode");
        
        // Reset avatar styling when leaving PiP
        if (avatarDiv) {
            avatarDiv.style.maxWidth = '350px';
            avatarDiv.style.fontSize = '';
        }
    });
}

function makeAvatarDraggable() {
    if (!avatarDiv) return;

    let isDragging = false;
    let offsetX, offsetY;
    
    //Need to add a draggable header to create a draggable area
    const header = avatarDiv.querySelector('div'); // Use the existing header div
    if (!header) return;
    
    header.style.cursor = 'move';
    header.style.userSelect = 'none'; // Prevent text selection while dragging
    
    header.addEventListener('mousedown', (e)=>{
        isDragging = true;
        offsetX = e.clientX - avatarDiv.getBoundingClientRect().left;//Offsets mouse position and top-left corner of avatar
        offsetY = e.clientY - avatarDiv.getBoundingClientRect().top;
        e.preventDefault(); // Prevent text selection
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
}

initialize();
let lastURL = location.href;
new MutationObserver(()=>{
    if (location.href !== lastURL){
        lastURL = location.href;
        setTimeout(initialize,1000);
    }
}).observe(document, {subtree:true, childList:true});