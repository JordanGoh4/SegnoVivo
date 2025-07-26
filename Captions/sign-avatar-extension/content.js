let avatarRenderer = null;

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

function startAvatar() {
    if (avatarRenderer) return; 
    injectFloatingAvatarBox();

    let testGloss = "HELLO";
    const glossDisplay = document.getElementById("gloss-display");
    glossDisplay.textContent = testGloss;

    fetch("https://your-render-or-local-domain/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gloss: testGloss })
    })
    .then(res => res.json())
    .then(data => {
        const caption = document.getElementById("caption-text");
        if (!data.frames || data.frames.length === 0) {
            caption.textContent = "⚠️ No animation data found";
            return;
        }
        caption.textContent = "";
        const canvas = document.getElementById("avatarCanvas");
        avatarRenderer = new DatasetAvatarRenderer(canvas, data.frames, data.fps);
        avatarRenderer.play();
    })
    .catch(err => {
        console.error(err);
        const caption = document.getElementById("caption-text");
        if (caption) caption.textContent = "⚠️ Error loading animation";
    });
}

function stopAvatar() {
    if (avatarRenderer) {
        avatarRenderer.stop();
        avatarRenderer = null;
    }
    const box = document.getElementById('floating-caption-box');
    if (box) box.remove();
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "START_AVATAR") {
        startAvatar();
    } else if (message.type === "STOP_AVATAR") {
        stopAvatar();
    }
});
