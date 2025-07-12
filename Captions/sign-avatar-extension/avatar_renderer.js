class DatasetAvatarRenderer {
    constructor(canvas, frames, fps = 24) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.frames = frames;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameRate = fps;
    }

    play() {
        if (!Array.isArray(this.frames) || this.frames.length === 0) {
            console.warn("⚠️ No frames to play in DatasetAvatarRenderer");
            return;
        }
        this.isPlaying = true;
        this.currentFrame = 0;
        this.loop();
    }

    loop() {
        if (!this.isPlaying || !this.frames || this.frames.length === 0) return;

        const frame = this.frames[this.currentFrame];
        if (!frame || typeof frame !== "object") {
            console.error("❌ Invalid frame format:", frame);
            return;
        }

        this.render(frame);
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;

        setTimeout(() => this.loop(), 1000 / this.frameRate);
    }

    stop() {
        this.isPlaying = false;
    }

    render(frame) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const hand = frame.right_hand || frame.left_hand;
        if (!Array.isArray(hand)) return;

        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hand[0][0] * this.canvas.width, hand[0][1] * this.canvas.height);

        for (let i = 1; i < hand.length; i++) {
            const [x, y] = hand[i];
            ctx.lineTo(x * this.canvas.width, y * this.canvas.height);
        }
        ctx.stroke();

        ctx.fillStyle = "#00ffcc";
        for (const [x, y] of hand) {
            ctx.beginPath();
            ctx.arc(x * this.canvas.width, y * this.canvas.height, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

window.DatasetAvatarRenderer = DatasetAvatarRenderer;