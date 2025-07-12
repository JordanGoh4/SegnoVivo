// 1. Inject floating caption box and canvas
function injectFloatingAvatarBox() {
    // Avoid duplicate injection
    if (document.getElementById("floating-caption-box")) return;

    // Create outer container
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

    // Add text caption element
    const caption = document.createElement("div");
    caption.id = "caption-text";
    caption.textContent = "Loading animation...";
    caption.style.marginBottom = "10px";
    caption.style.textAlign = "center";
    box.appendChild(caption);

    // Add avatar canvas
    const canvas = document.createElement("canvas");
    canvas.id = "avatarCanvas";
    canvas.width = 360;
    canvas.height = 280;
    canvas.style.borderRadius = "8px";
    canvas.style.background = "#111";
    box.appendChild(canvas);

    document.body.appendChild(box);
}

// 2. Call backend and render animation
function renderAvatarFromGloss(glossText) {
    const caption = document.getElementById("caption-text");
    const canvas = document.getElementById("avatarCanvas");

    if (caption) caption.textContent = glossText || "🤟";

    fetch("http://localhost:5000/generate-avatar", {
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

        const renderer = new DatasetAvatarRenderer(canvas, data.frames, data.fps);
        renderer.play();
    })
    .catch(err => {
        console.error("❌ Failed to fetch avatar data:", err);
        if (caption) caption.textContent = "⚠️ Error loading animation";
    });
}

// 3. Run this once your extension is activated
function runInterpreter(glossInput = "I LOVE YOU") {
    injectFloatingAvatarBox();
    renderAvatarFromGloss(glossInput);
}

// Example trigger for now:
runInterpreter("MY NAME VINCENT");  // replace with dynamic gloss later