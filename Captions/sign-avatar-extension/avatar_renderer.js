class DatasetAvatarRenderer {
    constructor(canvas, frames) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.frames = frames;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameRate = 30; // 30 FPS
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
        if (!frame || !Array.isArray(frame) || frame.length === 0) {
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

    render(pose) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const point of pose) {
            if (!Array.isArray(point) || point.length < 2) continue;
            const [x, y] = point;
            ctx.beginPath();
            ctx.arc(x * this.canvas.width, y * this.canvas.height, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#00ffcc";
            ctx.fill();
        }
    }
}

window.DatasetAvatarRenderer = DatasetAvatarRenderer;