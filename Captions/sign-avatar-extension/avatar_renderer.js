class DatasetAvatarRenderer {
    constructor(canvas, animation) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.animation = animation.frames;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.fps = animation.fps || 24;
    }

    play() {
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.render.bind(this));
    }

    stop() {
        this.isPlaying = false;
    }

    render(timestamp) {
        if (!this.isPlaying) return;

        const elapsed = timestamp - this.lastFrameTime;
        const frameDuration = 1000 / this.fps;

        if (elapsed >= frameDuration) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const frame = this.animation[this.currentFrame];
            this.drawFrame(frame);
            this.currentFrame = (this.currentFrame + 1) % this.animation.length;
            this.lastFrameTime = timestamp;
        }

        requestAnimationFrame(this.render.bind(this));
    }

    drawFrame(frame) {
        for (const joint of frame) {
            const [x, y, radius] = joint;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius || 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = "white";
            this.ctx.fill();
        }
    }
}