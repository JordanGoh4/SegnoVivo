let settings = {
    enabled: true,
    captionsEnabled: true,
    highContrast: false,
    animationQuality: "medium",
    captionSize: "16px"
};

const animationCache = new Map();
let captionsData = [];

function initialize() {
    if (!settings.enabled) return;
    const existingBox = document.getElementById("sign-avatar-cc");
    if (existingBox) return;

    createAvatar();
}

function removeAvatar() {
    const avatarBox = document.getElementById("sign-avatar-cc");
    if (avatarBox) avatarBox.remove();
    captionsData = []; 
}

document.addEventListener("signAvatarSettingsChanged", (event) => {
    settings = event.detail;
    const box = document.getElementById("sign-avatar-cc");
    if (!box) return;
    box.style.fontSize = settings.captionSize;
    box.style.backgroundColor = settings.highContrast ? "#000" : "transparent";
});

function createAvatar() {
    const box = document.createElement("div");
    box.id = "sign-avatar-cc";
    box.style.position = "fixed";
    box.style.bottom = "10px";
    box.style.right = "10px";
    box.style.zIndex = "999999";
    box.style.fontSize = settings.captionSize;
    box.style.backgroundColor = settings.highContrast ? "#000" : "transparent";
    box.style.padding = "8px";
    box.style.borderRadius = "10px";
    box.style.cursor = "move";
    box.style.color = "#fff";

    const captions = document.createElement("div");
    captions.className = "ytp-caption-segment";
    captions.innerText = "...";
    box.appendChild(captions);

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    box.appendChild(canvas);
    document.body.appendChild(box);

    if (typeof DatasetAvatarRenderer !== "function") {
        console.error("DatasetAvatarRenderer not loaded");
        return;
    }

    let offsetX = 0, offsetY = 0, isDragging = false;
    box.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        box.style.left = e.clientX - offsetX + "px";
        box.style.top = e.clientY - offsetY + "px";
        box.style.bottom = "auto";
        box.style.right = "auto";
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    const videoId = new URLSearchParams(window.location.search).get("v");
    if (!videoId) return;

    fetch("http://localhost:5000/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
    })
    .then(res => res.json())
    .then(data => {
        captionsData = data.asl_segments || [];
        requestAnimationFrame(syncCaptions);  
        if (captionsData.length > 0) {
            generateDatasetAvatarForSegment(captionsData[0], canvas);
        }
    });

    function syncCaptions() {
        const video = document.querySelector("video");
        if (!video || captionsData.length === 0) return;

        const currentTime = video.currentTime;
        for (const segment of captionsData) {
            if (currentTime >= segment.start && currentTime <= segment.end) {
                if (captions.innerText !== segment.english) {
                    captions.innerText = segment.english;
                    generateDatasetAvatarForSegment(segment, canvas);
                }
                break;
            }
        }

        requestAnimationFrame(syncCaptions);
    }
}

function generateDatasetAvatarForSegment(segment, canvas) {
    const cacheKey = segment.english;
    if (animationCache.has(cacheKey)) {
        const animation = animationCache.get(cacheKey);
        const renderer = new DatasetAvatarRenderer(canvas, animation);
        renderer.play();
        return;
    }

    fetch("http://localhost:5000/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asl_gloss: segment.asl_gloss })
    })
    .then(res => res.json())
    .then(data => {
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        animationCache.set(cacheKey, data.data);
        const renderer = new DatasetAvatarRenderer(canvas, data.data);
        renderer.play();
    } else {
        console.warn("⚠️ Invalid or empty animation data:", data);
    }
});
}

initialize();
let lastURL = location.href;
new MutationObserver(() => {
    if (location.href !== lastURL) {
        lastURL = location.href;
        removeAvatar();
        animationCache.clear();
        setTimeout(initialize, 1000);
    }
}).observe(document, { subtree: true, childList: true });