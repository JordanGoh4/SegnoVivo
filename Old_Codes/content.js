let settings = {
    active: false,
    autoStart: true,
    pipMode: false,
    highContrast: false,
    showAvatar: true,
    avatarSize: 150,
    avatarMethod: 'dataset',
    showAllCaptions: false,
    highlightFingerspelling: true,
    aslOnly: false
};

let avatarDiv = null;
let isAvatarDisplayed = false;
let currentAvatarAnimations = new Map();
let animationCache = new Map();


class DatasetAvatarRenderer {
    constructor(container, size = 150) {
        this.container = container;
        this.size = size;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.currentAnimation = null;
        this.frameIndex = 0;
        this.isPlaying = false;
        this.animationSpeed = 1.0;
        
        this.initCanvas();
        this.initControls();
    }
    
    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.background = settings.highContrast ? '#000000' : '#f0f8ff';
        
        this.ctx = this.canvas.getContext('2d');
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        
        this.setupDrawingContext();
    }
    
    setupDrawingContext() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
    }
    
    initControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'avatar-controls';
        controlsDiv.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 5px;
            background: rgba(0,0,0,0.8);
            padding: 6px 10px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        `;
        
        const playBtn = this.createControlButton('▶️', () => {
            if (this.isPlaying) {
                this.pause();
                playBtn.textContent = '▶️';
            } else {
                this.play();
                playBtn.textContent = '⏸️';
            }
        });
        
        const resetBtn = this.createControlButton('⏮️', () => {
            this.reset();
            playBtn.textContent = '▶️';
        });
        
        const speedBtn = this.createControlButton('1x', () => {
            this.cycleSpeed();
            speedBtn.textContent = `${this.animationSpeed}x`;
        });
        
        const qualityIndicator = document.createElement('div');
        qualityIndicator.className = 'quality-indicator';
        qualityIndicator.style.cssText = `
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 8px;
            background: rgba(45, 114, 217, 0.7);
        `;
        qualityIndicator.textContent = 'Dataset';
        
        controlsDiv.appendChild(resetBtn);
        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(speedBtn);
        controlsDiv.appendChild(qualityIndicator);
        
        this.container.style.position = 'relative';
        this.container.appendChild(controlsDiv);
        
        this.playBtn = playBtn;
        this.qualityIndicator = qualityIndicator;
    }
    
    createControlButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.2s;
        `;
        button.addEventListener('click', onClick);
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255,255,255,0.2)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'none';
        });
        return button;
    }
    
    cycleSpeed() {
        const speeds = [0.5, 1.0, 1.5, 2.0];
        const currentIndex = speeds.indexOf(this.animationSpeed);
        this.animationSpeed = speeds[(currentIndex + 1) % speeds.length];
    }
    
    async loadAnimation(animationData) {
        try {
            console.log('Loading animation:', animationData);
            this.currentAnimation = animationData;
            this.frameIndex = 0;
            
            this.updateQualityIndicator(animationData);
            
            if (animationData.type === 'real_dataset_poses') {
                await this.loadDatasetAnimation(animationData);
            } else if (animationData.type === 'mediapipe_poses') {
                await this.loadMediaPipeAnimation(animationData);
            } else {
                await this.loadFallbackAnimation(animationData);
            }
            
            this.render();
            
        } catch (error) {
            console.error('Error loading animation:', error);
            this.loadErrorAnimation();
        }
    }
    
    updateQualityIndicator(animationData) {
        const dataSource = animationData.data_source || 'unknown';
        let quality = 'Basic';
        let color = 'rgba(128, 128, 128, 0.7)';
        
        if (dataSource === 'real_asl_datasets') {
            quality = 'Dataset';
            color = 'rgba(45, 114, 217, 0.7)';
        } else if (animationData.libraries_used?.includes('mediapipe')) {
            quality = 'MediaPipe';
            color = 'rgba(76, 175, 80, 0.7)';
        }
        
        this.qualityIndicator.textContent = quality;
        this.qualityIndicator.style.background = color;
    }
    
    async loadDatasetAnimation(animationData) {
        this.animationSequence = animationData.animation_sequence || [];
        this.totalFrames = animationData.total_frames || 30;
        this.fps = animationData.fps || 30;
        this.dataSource = animationData.data_source;
        
        console.log(`Loaded dataset animation: ${this.animationSequence.length} words, ${this.totalFrames} frames`);
    }
    
    async loadMediaPipeAnimation(animationData) {
        this.poseData = animationData.pose_sequence || [];
        this.totalFrames = this.poseData.length;
        this.fps = animationData.fps || 30;
    }
    
    async loadFallbackAnimation(animationData) {
        this.totalFrames = 60;
        this.fps = 30;
        this.fallbackData = animationData;
    }
    
    loadErrorAnimation() {
        this.totalFrames = 30;
        this.fps = 30;
        this.errorMode = true;
        this.qualityIndicator.textContent = 'Error';
        this.qualityIndicator.style.background = 'rgba(244, 67, 54, 0.7)';
    }
    
    play() {
        if (!this.currentAnimation) return;
        
        this.isPlaying = true;
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.render();
            this.frameIndex++;
            
            if (this.frameIndex >= this.totalFrames) {
                this.frameIndex = 0; 
            }
            
            const frameDelay = (1000 / this.fps) / this.animationSpeed;
            setTimeout(() => {
                this.animationFrame = requestAnimationFrame(animate);
            }, frameDelay);
        };
        
        animate();
    }
    
    pause() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    reset() {
        this.pause();
        this.frameIndex = 0;
        this.render();
    }
    
    render() {
        if (!this.ctx) return;
        
        this.clearCanvas();
        
        if (this.errorMode) {
            this.renderError();
        } else if (this.currentAnimation?.type === 'real_dataset_poses') {
            this.renderDatasetAnimation();
        } else if (this.currentAnimation?.type === 'mediapipe_poses') {
            this.renderMediaPipeAnimation();
        } else {
            this.renderFallback();
        }
        
        this.renderProgressIndicator();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = settings.highContrast ? '#000000' : '#f0f8ff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderDatasetAnimation() {
        if (!this.animationSequence || this.animationSequence.length === 0) return;
        
        let currentFrame = this.frameIndex;
        let currentWordData = null;
        let frameInWord = 0;
        
        for (const wordData of this.animationSequence) {
            if (currentFrame < wordData.frame_count) {
                currentWordData = wordData;
                frameInWord = currentFrame;
                break;
            }
            currentFrame -= wordData.frame_count;
        }
        
        if (!currentWordData) return;
        
        const quality = currentWordData.quality || 'basic';
        
        if (quality === 'high' && currentWordData.frames && currentWordData.frames[frameInWord]) {
            this.renderHighQualityFrame(currentWordData, frameInWord);
        } else if (quality === 'medium') {
            this.renderMediumQualityFrame(currentWordData, frameInWord);
        } else if (currentWordData.type === 'fingerspelling') {
            this.renderFingerspellingFrame(currentWordData, frameInWord);
        } else {
            this.renderBasicFrame(currentWordData, frameInWord);
        }
        
        this.renderCurrentWord(currentWordData.word, currentWordData.dataset);
    }
    
    renderHighQualityFrame(wordData, frameIndex) {
        const frame = wordData.frames[frameIndex];
        if (!frame || !frame.hand_landmarks) return;
        
        this.drawHandLandmarks(frame.hand_landmarks, '#4ecdc4', 'Real Data');
        
        if (frameIndex > 0) {
            this.drawMovementTrail(wordData.frames, frameIndex);
        }
        

        if (frame.handshape) {
            this.drawHandshapeLabel(frame.handshape);
        }
    }
    
    renderMediumQualityFrame(wordData, frameIndex) {
        const properties = wordData.linguistic_properties;
        if (!properties) return;
        
        const position = this.calculatePositionFromProperties(properties, frameIndex, wordData.frame_count);
        
        this.drawHandPosition(position.x, position.y, '#ff9800', 'Linguistic');
        if (properties.complexity) {
            this.drawComplexityIndicator(properties.complexity);
        }
    }
    
    renderFingerspellingFrame(wordData, frameIndex) {
        const lettersPerFrame = Math.floor(wordData.frame_count / wordData.letters.length);
        const currentLetterIndex = Math.floor(frameIndex / lettersPerFrame);
        const currentLetter = wordData.letters[currentLetterIndex];
        
        if (!currentLetter) return;
        
        this.drawFingerspellingLetter(currentLetter, frameIndex % lettersPerFrame, lettersPerFrame);
        this.drawLetterProgress(wordData.letters, currentLetterIndex);
    }
    
    renderBasicFrame(wordData, frameIndex) {
        const movement = wordData.movement || 'static';
        const location = wordData.location || 'neutral';
        
        const position = this.getBasicPosition(movement, location, frameIndex, wordData.frame_count);
        this.drawHandPosition(position.x, position.y, '#9e9e9e', 'Basic');
    }
    
    drawHandLandmarks(landmarks, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;
        
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            

            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            if (index > 0 && index % 4 !== 1) { 
                const prevLandmark = landmarks[index - 1];
                const prevX = prevLandmark.x * this.canvas.width;
                const prevY = prevLandmark.y * this.canvas.height;
                
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        });
        
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(label, this.canvas.width - 40, 15);
    }
    
    drawMovementTrail(frames, currentFrameIndex) {
        if (currentFrameIndex < 3) return;
        
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        for (let i = Math.max(0, currentFrameIndex - 10); i < currentFrameIndex; i++) {
            const frame = frames[i];
            if (frame && frame.hand_landmarks && frame.hand_landmarks[0]) {
                const landmark = frame.hand_landmarks[0];
                const x = landmark.x * this.canvas.width;
                const y = landmark.y * this.canvas.height;
                
                if (i === Math.max(0, currentFrameIndex - 10)) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.stroke();
    }
    
    drawHandPosition(x, y, color, label) {
        const canvasX = x * this.canvas.width;
        const canvasY = y * this.canvas.height;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 15, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(label, this.canvas.width - 40, 15);
    }
    
    drawFingerspellingLetter(letter, frameInLetter, totalFramesForLetter) {
        const x = 0.65 * this.canvas.width;
        const y = 0.5 * this.canvas.height;
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(letter, x, y);
        
        this.ctx.strokeStyle = '#ff5722';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y + 20, 10, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        const opacity = Math.sin((frameInLetter / totalFramesForLetter) * Math.PI);
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = '#ff5722';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Fingerspelling', x, y + 40);
        this.ctx.globalAlpha = 1.0;
    }
    
    drawLetterProgress(letters, currentIndex) {
        const startX = 10;
        const y = this.canvas.height - 20;
        
        this.ctx.font = '10px Arial';
        
        letters.forEach((letter, index) => {
            const x = startX + (index * 15);
            
            if (index === currentIndex) {
                this.ctx.fillStyle = '#ff5722';
                this.ctx.font = 'bold 12px Arial';
            } else if (index < currentIndex) {
                this.ctx.fillStyle = '#4caf50';
                this.ctx.font = '10px Arial';
            } else {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.font = '10px Arial';
            }
            
            this.ctx.fillText(letter, x, y);
        });
    }
    
    calculatePositionFromProperties(properties, frameIndex, totalFrames) {
        const progress = frameIndex / totalFrames;
        const baseX = 0.5;
        const baseY = 0.5;
        
        const movement = properties.movement || '';
        let x = baseX;
        let y = baseY;
        
        if (movement.includes('circular')) {
            const angle = progress * 2 * Math.PI;
            x = baseX + 0.1 * Math.cos(angle);
            y = baseY + 0.1 * Math.sin(angle);
        } else if (movement.includes('forward')) {
            x = baseX + (progress * 0.2);
        } else if (movement.includes('up')) {
            y = baseY - (progress * 0.2);
        }
        
        return { x, y };
    }
    
    getBasicPosition(movement, location, frameIndex, totalFrames) {
        const progress = frameIndex / totalFrames;
        let baseX = 0.5, baseY = 0.5;
        
        if (location.includes('chest')) baseY = 0.6;
        if (location.includes('head')) baseY = 0.3;
        if (location.includes('side')) baseX = 0.7;
        
        let x = baseX, y = baseY;
        if (movement === 'wave') {
            x = baseX + 0.05 * Math.sin(progress * Math.PI * 4);
        } else if (movement === 'circular') {
            const angle = progress * 2 * Math.PI;
            x = baseX + 0.05 * Math.cos(angle);
            y = baseY + 0.05 * Math.sin(angle);
        }
        
        return { x, y };
    }
    
    renderCurrentWord(word, dataset) {
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(word, this.canvas.width / 2, this.canvas.height - 40);
        
        this.ctx.fillStyle = '#666666';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`Source: ${dataset}`, this.canvas.width / 2, this.canvas.height - 25);
    }
    
    renderProgressIndicator() {
        const progress = this.frameIndex / this.totalFrames;
        const barWidth = this.canvas.width - 20;
        const barHeight = 3;
        const x = 10;
        const y = this.canvas.height - 10;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
    }
    
    renderError() {
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠️ Avatar Error', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Check dataset connection', this.canvas.width / 2, this.canvas.height / 2 + 10);
    }
    
    renderFallback() {
        this.ctx.fillStyle = settings.highContrast ? '#ffffff' : '#333333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🤟 ASL Avatar Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }
}

document.addEventListener('signAvatarSettingsChanged', (event) => {
    settings = event.detail;

    if (settings.active && !isAvatarDisplayed) {
        createAvatar();
    } else if (!settings.active && isAvatarDisplayed) {
        removeAvatar();
    }

    if (avatarDiv) {
        applyAvatarStyles();
    }
});

function initialize() {
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

        if (settings.active && settings.autoStart) {
            createAvatar();
        }

        setUpPipObserver();
    });
}

async function createAvatar() {
    if (isAvatarDisplayed) return;
    
    const videoId = new URLSearchParams(window.location.search).get("v");
    if (!videoId) return;
    
    try {
        avatarDiv = document.createElement("div");
        avatarDiv.id = 'sign-avatar-cc';
        avatarDiv.style.position = 'fixed';
        avatarDiv.style.bottom = '80px';
        avatarDiv.style.right = '20px';
        avatarDiv.style.background= "rgba(255,255,255,0.9)";
        avatarDiv.style.padding= '15px';
        avatarDiv.style.borderRadius = '8px';
        avatarDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.30)';
        avatarDiv.style.zIndex = '9999';
        avatarDiv.style.maxWidth = '350px';
        avatarDiv.style.transition = 'all 0.2s ease';

        avatarDiv.innerHTML = `<div style= 'display: flex; align-items: center;'>
            <span style = 'font-weight: bold; margin-right: 10px;'>Sign CC (Dataset Mode)</span>
            <div class = 'loading-spinner' style='width: 16px; height: 16px; border: 2px solid #ccc;
            border-top-color: #2d72d9; border-radius: 50%; animation: spin 1s linear infinite;'></div>
        </div>
        <p style='margin-top: 10px; font-size: 14px;'>Loading real ASL dataset...</p>`;

        const style = document.createElement('style');
        style.textContent = `@keyframes spin{ to{transform: rotate(360deg); } }`;
        document.head.appendChild(style);
        document.body.appendChild(avatarDiv);
        isAvatarDisplayed = true;

        applyAvatarStyles();
        
        const response = await fetch("http://localhost:5000/transcribe", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({videoId})
        });
        
        if (!response.ok){
            throw new Error(`Server Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (avatarDiv){
            avatarDiv.innerHTML = `
            <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'>
                <span style='font-weight: bold;'>ASL Captions (Real Datasets)</span>
                <button id='close-avatar' style='background: none; border: none; cursor: pointer; font-size: 16px;'>×</button>
            </div>
            <div id="asl-captions-container" style='max-height: 200px; overflow-y: auto;'></div>
            `;

            const captionsContainer = document.getElementById('asl-captions-container');
            
            if (data.asl_segments && data.asl_segments.length > 0) {
                for (const segment of data.asl_segments) {
                    const captionDiv = document.createElement('div');
                    captionDiv.className = 'asl-caption';
                    captionDiv.style.marginBottom = '12px';
                    captionDiv.style.paddingBottom = '8px';
                    captionDiv.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
                    
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
                        
                        captionDiv.dataset.start = segment.start;
                        captionDiv.dataset.end = segment.end;
                    }
                    
                    captionDiv.innerHTML = `
                        ${timestampHtml}
                        <div class="asl-text" style="font-weight: bold; color: #2d72d9; margin-bottom: 4px; font-size: 1.1em;">
                            ${segment.asl_gloss}
                        </div>
                        <div class="english-text" style="font-size: 0.8em; color: #666; margin-bottom: 10px;">
                            ${segment.english}
                        </div>
                        <div class="dataset-avatar-container" style="width: 100%; height: ${settings.avatarSize}px; border-radius: 8px; overflow: hidden; margin-top: 10px; display: none; background: #f5f5f5; position: relative;">
                            <p style="text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #888; margin: 0;">Loading dataset avatar...</p>
                        </div>
                    `;
                    
                    captionsContainer.appendChild(captionDiv);
                    
                    if (settings.showAvatar) {
                        const avatarContainer = captionDiv.querySelector('.dataset-avatar-container');
                        avatarContainer.style.display = 'block';
                        
                        generateDatasetAvatarForSegment(segment.asl_gloss, avatarContainer);
                    }
                }
            } else {
                captionsContainer.innerHTML = '<p>ASL translation unavailable</p>';
            }

            document.getElementById('close-avatar').addEventListener('click', ()=> {
                removeAvatar();
                settings.active = false;
                chrome.storage.sync.set({active: false});
            });
            
            makeAvatarDraggable();
            syncCaptionsWithVideo();
        }
    } catch (error) {
        console.error("Error with dataset CC:", error);
    
        if (avatarDiv) {
            avatarDiv.innerHTML = `
            <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'>
                <span style='font-weight: bold;'>Sign CC</span>
                <button id='close-avatar' style='background: none; border: none; cursor: pointer; font-size: 16px;'>×</button>
            </div>
            <p style='color: red; margin-top: 10px;'>Dataset loading failed. Check backend connection.</p>
         `;
         document.getElementById('close-avatar').addEventListener('click', removeAvatar);
        }
    }
}

async function generateDatasetAvatarForSegment(aslGloss, containerElement) {
    try {

        if (animationCache.has(aslGloss)) {
            const cachedData = animationCache.get(aslGloss);
            renderCachedAvatar(cachedData, containerElement);
            return;
        }

        
        const response = await fetch("http://localhost:5000/generate-avatar", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                asl_gloss: aslGloss,
                method: 'dataset'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            animationCache.set(aslGloss, data);
            
            const renderer = new DatasetAvatarRenderer(containerElement, settings.avatarSize);
            
            
            await renderer.loadAnimation(data.data);
            currentAvatarAnimations.set(aslGloss, renderer);
            
            setTimeout(() => {
                renderer.play();
            }, 500);
            
            addDatasetInfo(containerElement, data);
            
        } else {
            renderAvatarError(containerElement, "Dataset generation failed");
        }
    } catch (error) {
        console.error("Error generating dataset avatar:", error);
        renderAvatarError(containerElement, "Connection to dataset backend failed");
    }
}

function renderCachedAvatar(cachedData, containerElement) {
    const renderer = new DatasetAvatarRenderer(containerElement, settings.avatarSize);
    renderer.loadAnimation(cachedData.data).then(() => {
        renderer.play();
    });
    
    addDatasetInfo(containerElement, cachedData);
}

function addDatasetInfo(containerElement, avatarData) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'dataset-info';
    infoDiv.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        cursor: pointer;
        transition: opacity 0.3s;
    `;
    
    const method = avatarData.method || 'unknown';
    const dataSource = avatarData.data?.data_source || 'unknown';
    
    infoDiv.innerHTML = `📊 ${method}`;
    infoDiv.title = `Data source: ${dataSource}\nLibraries: ${avatarData.libraries_used?.join(', ') || 'unknown'}`;
    containerElement.addEventListener('mouseenter', () => {
        infoDiv.style.opacity = '1';
    });
    containerElement.addEventListener('mouseleave', () => {
        infoDiv.style.opacity = '0.7';
    });
    
    containerElement.appendChild(infoDiv);
}

function renderAvatarError(containerElement, errorMessage) {
    containerElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; text-align: center; padding: 10px;">
            <div style="font-size: 20px; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Dataset Error</div>
            <div style="font-size: 10px; opacity: 0.9;">${errorMessage}</div>
        </div>
    `;
}

function syncCaptionsWithVideo() {
    const video = document.querySelector('video');
    if (!video || !avatarDiv) return;
    
    const updateCaptions = () => {
        const currentTime = video.currentTime;
        const captions = avatarDiv.querySelectorAll('.asl-caption');
        let foundActiveCaption = false;
        
        captions.forEach(caption => {
            if (!caption.dataset.start || !caption.dataset.end) return;
            
            const startTime = parseFloat(caption.dataset.start);
            const endTime = parseFloat(caption.dataset.end);
            
            if (currentTime >= startTime && currentTime <= endTime) {
                caption.style.display = 'block';
                caption.style.backgroundColor = 'rgba(45, 114, 217, 0.1)';
                caption.style.border = '2px solid rgba(45, 114, 217, 0.3)';
                foundActiveCaption = true;
                
                const aslText = caption.querySelector('.asl-text').textContent;
                const renderer = currentAvatarAnimations.get(aslText);
                if (renderer && !renderer.isPlaying) {
                    renderer.reset();
                    renderer.play();
                }
                
                caption.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                caption.style.display = settings.showAllCaptions ? 'block' : 'none';
                caption.style.backgroundColor = 'transparent';
                caption.style.border = 'none';
            }
        });
        
        if (!foundActiveCaption && settings.showAllCaptions) {
            captions.forEach(caption => {
                caption.style.display = 'block';
            });
        }
    };
    
    video.addEventListener('timeupdate', updateCaptions);
    avatarDiv.dataset.hasTimeSync = 'true';
}

function removeAvatar() {
    if (avatarDiv) {
        currentAvatarAnimations.forEach(renderer => {
            renderer.pause();
        });
        currentAvatarAnimations.clear();
        
        avatarDiv.remove();
        avatarDiv = null;
        isAvatarDisplayed = false;
    }
}

function applyAvatarStyles() {
    if (!avatarDiv) return;

    if (settings.highContrast){
        avatarDiv.style.background = '#000000';
        avatarDiv.style.color = '#ffffff';
        avatarDiv.style.border = '2px solid #ffffff';
        
        const aslTexts = avatarDiv.querySelectorAll('.asl-text');
        aslTexts.forEach(text => {
            text.style.color = '#4da6ff';
        });
    } else{
        avatarDiv.style.background = 'rgba(255,255,255,0.9)';
        avatarDiv.style.color = '#000000';
        avatarDiv.style.border = 'none';
        
        const aslTexts = avatarDiv.querySelectorAll('.asl-text');
        aslTexts.forEach(text => {
            text.style.color = '#2d72d9';
        });
    }
    
    const avatarContainers = avatarDiv.querySelectorAll('.dataset-avatar-container');
    avatarContainers.forEach(container => {
        container.style.display = settings.showAvatar ? 'block' : 'none';
        container.style.height = `${settings.avatarSize}px`;
        
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.width = settings.avatarSize;
            canvas.height = settings.avatarSize;
            canvas.style.background = settings.highContrast ? '#000000' : '#f0f8ff';
        }
    });
    
    if (settings.aslOnly) {
        const englishTexts = avatarDiv.querySelectorAll('.english-text');
        englishTexts.forEach(text => {
            text.style.display = 'none';
        });
    } else {
        const englishTexts = avatarDiv.querySelectorAll('.english-text');
        englishTexts.forEach(text => {
            text.style.display = 'block';
        });
    }
    
    if (settings.highlightFingerspelling) {
        const aslTexts = avatarDiv.querySelectorAll('.asl-text');
        aslTexts.forEach(text => {
            const words = text.textContent.split(' ');
            const highlightedWords = words.map(word => {
                const commonASLWords = ['I', 'YOU', 'ME', 'HELLO', 'THANK-YOU', 'GOOD', 'BAD', 'YES', 'NO'];
                if (word.length > 2 && !commonASLWords.includes(word)) {
                    return `<span style="background: rgba(255, 152, 0, 0.3); padding: 2px 4px; border-radius: 3px;" title="Likely fingerspelled">${word}</span>`;
                }
                return word;
            });
            text.innerHTML = highlightedWords.join(' ');
        });
    }
}

function setUpPipObserver(){
    document.addEventListener('enterpictureinpicture', (event) => {
        if (settings.pipMode && settings.active) {
            const pipWindow = event.pictureInPictureWindow;
            console.log("In PiP Mode, size:", pipWindow.width, pipWindow.height);
            
            if (avatarDiv) {
                avatarDiv.style.position = 'fixed';
                avatarDiv.style.zIndex = '2147483647';
                avatarDiv.style.bottom = '10px';
                avatarDiv.style.right = '10px';
                avatarDiv.style.maxWidth = '200px';
                avatarDiv.style.fontSize = '12px';
                
                currentAvatarAnimations.forEach(renderer => {
                    if (renderer.canvas) {
                        renderer.canvas.width = 100;
                        renderer.canvas.height = 100;
                    }
                });
            }
        }
    });
    
    document.addEventListener('leavepictureinpicture', () => {
        console.log("Exited PiP Mode");
        
        if (avatarDiv) {
            avatarDiv.style.maxWidth = '350px';
            avatarDiv.style.fontSize = '';
            currentAvatarAnimations.forEach(renderer => {
                if (renderer.canvas) {
                    renderer.canvas.width = settings.avatarSize;
                    renderer.canvas.height = settings.avatarSize;
                }
            });
        }
    });
}

function makeAvatarDraggable() {
    if (!avatarDiv) return;

    let isDragging = false;
    let offsetX, offsetY;
    
    const header = avatarDiv.querySelector('div');
    if (!header) return;
    
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    
    header.addEventListener('mousedown', (e)=>{
        isDragging = true;
        offsetX = e.clientX - avatarDiv.getBoundingClientRect().left;
        offsetY = e.clientY - avatarDiv.getBoundingClientRect().top;
        e.preventDefault();
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
const debouncedAvatarGeneration = debounce(generateDatasetAvatarForSegment, 300);


document.addEventListener('keydown', (e) => {
    if (!avatarDiv || !settings.active) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
        case 'a':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                currentAvatarAnimations.forEach(renderer => {
                    if (renderer.isPlaying) {
                        renderer.pause();
                    } else {
                        renderer.play();
                    }
                });
            }
            break;
        case 'r':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                currentAvatarAnimations.forEach(renderer => {
                    renderer.reset();
                });
            }
            break;
        case 'h':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                settings.highContrast = !settings.highContrast;
                applyAvatarStyles();
                chrome.storage.sync.set({highContrast: settings.highContrast});
            }
            break;
    }
});


initialize();
let lastURL = location.href;
new MutationObserver(()=>{
    if (location.href !== lastURL){
        lastURL = location.href;
        
        removeAvatar();
        animationCache.clear();
        
        setTimeout(initialize, 1000);
    }
}).observe(document, {subtree:true, childList:true});

const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    .asl-caption {
        transition: all 0.3s ease;
    }
    
    .asl-caption:hover {
        transform: translateX(5px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .dataset-avatar-container {
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .dataset-avatar-container:hover {
        border-color: rgba(45, 114, 217, 0.3);
        box-shadow: 0 4px 12px rgba(45, 114, 217, 0.2);
    }
    
    .avatar-controls button:hover {
        transform: scale(1.1);
    }
    
    @keyframes datasetPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1.0; }
    }
    
    .dataset-info {
        animation: datasetPulse 2s infinite;
    }
`;
document.head.appendChild(enhancedStyles);

console.log('🤟 Sign Avatar CC (Dataset Mode) loaded successfully!');
console.log('Features: Real ASL datasets, MediaPipe rendering, animation caching, keyboard shortcuts');