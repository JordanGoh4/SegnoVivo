let observer = null;
let lastCaption = "";
let isActive = false;

function injectFloatingAvatarBox() {
    if (document.getElementById("floating-caption-box")) return;

    const box = document.createElement("div");
    box.id = "floating-caption-box";
    box.style.position = "fixed";
    box.style.bottom = "20px";
    box.style.right = "20px";
    box.style.width = "400px";
    box.style.padding = "10px";
    box.style.background = "#000000cc";
    box.style.color = "white";
    box.style.fontSize = "16px";
    box.style.zIndex = "9999";
    box.style.borderRadius = "12px";
    box.style.backdropFilter = "blur(6px)";
    box.style.boxShadow = "0 0 10px rgba(0,0,0,0.6)";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.alignItems = "center";

    const glossDisplay = document.createElement("div");
    glossDisplay.id = "gloss-display";
    glossDisplay.style.marginBottom = "10px";
    glossDisplay.style.textAlign = "center";
    glossDisplay.style.fontWeight = "bold";
    glossDisplay.style.fontSize = "18px";
    box.appendChild(glossDisplay);

    const caption = document.createElement("div");
    caption.id = "caption-text";
    caption.textContent = "Awaiting animation...";
    caption.style.marginBottom = "10px";
    caption.style.textAlign = "center";
    box.appendChild(caption);

    const canvas = document.createElement("canvas");
    canvas.id = "avatarCanvas";
    canvas.width = 360;
    canvas.height = 280;
    canvas.style.borderRadius = "8px";
    canvas.style.background = "#111";
    box.appendChild(canvas);

    document.body.appendChild(box);
}

function renderAvatarFromGloss(glossText) {
    const glossDisplay = document.getElementById("gloss-display");
    const caption = document.getElementById("caption-text");
    const canvas = document.getElementById("avatarCanvas");

    if (glossDisplay) glossDisplay.textContent = glossText || "";
    if (caption) caption.textContent = glossText ? "Loading animation..." : "🤟";

    fetch("https://captions-k2t3.onrender.com/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gloss: glossText })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.frames || data.frames.length === 0) {
            caption.textContent = "⚠️ No animation data found";
            return;
        }
        caption.textContent = "";
        const renderer = new DatasetAvatarRenderer(canvas, data.frames, data.fps);
        renderer.play();
        window.currentAvatarRenderer = renderer;
    })
    .catch(err => {
        console.error("❌ Failed to fetch avatar data:", err);
        if (caption) caption.textContent = "⚠️ Error loading animation";
    });
}

function getYouTubeCaptionContainer() {
    return (
        document.querySelector(".ytp-caption-segment") ||
        document.querySelector(".caption-window") ||
        document.querySelector(".ytp-caption-window-container") ||
        document.querySelector('yt-formatted-string.captions-text')
    );
}

function handleNewCaption(captionText) {
    if (!captionText || captionText.trim() === "" || captionText.trim() === lastCaption) return;
    lastCaption = captionText.trim();
    renderAvatarFromGloss(lastCaption);
}

function startInterpreter() {
    if (isActive) return;
    isActive = true;
    injectFloatingAvatarBox();
    lastCaption = "";

    const primaryContainer = getYouTubeCaptionContainer();
    if (primaryContainer) {
        // Immediately process the current caption when starting
        let currentText = primaryContainer.textContent || primaryContainer.innerText || "";
        handleNewCaption(currentText);

        observer = new MutationObserver(() => {
            let newText;
            if (primaryContainer.classList.contains("ytp-caption-window-container")) {
                newText = primaryContainer.innerText;
            } else if (primaryContainer.querySelectorAll(".ytp-caption-segment").length > 0) {
                newText = Array.from(primaryContainer.querySelectorAll(".ytp-caption-segment"))
                    .map(el => el.textContent).join(" ");
            } else {
                newText = primaryContainer.textContent || primaryContainer.innerText || "";
            }
            handleNewCaption(newText);
        });
        observer.observe(primaryContainer, { childList: true, subtree: true, characterData: true });
        window.captionObserver = observer;
    } else {
        // fallback for videos with unusual caption containers
        window.captionInterval = setInterval(() => {
            const cont = getYouTubeCaptionContainer();
            if (cont) {
                let newText = cont.textContent || cont.innerText || "";
                handleNewCaption(newText);
            }
        }, 700);
    }
}

function stopInterpreter() {
    if (!isActive) return;
    isActive = false;
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (window.captionInterval) {
        clearInterval(window.captionInterval);
        window.captionInterval = null;
    }
    if (window.currentAvatarRenderer) {
        window.currentAvatarRenderer.stop();
        window.currentAvatarRenderer = null;
    }
    const box = document.getElementById('floating-caption-box');
    if (box) box.remove();
    lastCaption = "";
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "START_AVATAR") startInterpreter();
    if (message.type === "STOP_AVATAR") stopInterpreter();
});
