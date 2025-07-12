class DatasetAvatarRenderer {
    constructor(canvas, frames, fps = 24) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.frames = frames;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameRate = fps;
        this.connections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Middle
            [0, 9], [9, 10], [10, 11], [11, 12],
            // Ring
            [0, 13], [13, 14], [14, 15], [15, 16],
            // Pinky
            [0, 17], [17, 18], [18, 19], [19, 20]
        ];
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
        if (!this.isPlaying || this.frames.length === 0) return;

        const frame = this.frames[this.currentFrame];
        if (!frame || !frame.right_hand || frame.right_hand.length !== 21) {
            console.error("❌ Invalid frame format or incomplete hand keypoints:", frame);
            return;
        }

        this.render(frame.right_hand);
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;

        setTimeout(() => this.loop(), 1000 / this.frameRate);
    }

    stop() {
        this.isPlaying = false;
    }

    render(points) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const scaleX = this.canvas.width;
        const scaleY = this.canvas.height;

        // Draw connections
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        for (const [start, end] of this.connections) {
            const [x1, y1] = points[start];
            const [x2, y2] = points[end];
            ctx.beginPath();
            ctx.moveTo(x1 * scaleX, y1 * scaleY);
            ctx.lineTo(x2 * scaleX, y2 * scaleY);
            ctx.stroke();
        }

        // Draw dots
        for (const [x, y] of points) {
            ctx.beginPath();
            ctx.arc(x * scaleX, y * scaleY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        }
    }
}

window.DatasetAvatarRenderer = DatasetAvatarRenderer;