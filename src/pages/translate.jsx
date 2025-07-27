import { useEffect, useRef } from "react";
import "../css/Translate.css";

const BACKEND_URL = "https://test-2qyi.onrender.com/predict";

function Translate() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const handsScript = document.createElement("script");
    handsScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    handsScript.async = true;
    document.body.appendChild(handsScript);

    const cameraScript = document.createElement("script");
    cameraScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
    cameraScript.async = true;
    document.body.appendChild(cameraScript);

    let hands, camera;
    let sequence = [];
    const sequenceLength = 30;
    let isPredicting = false;
    let lastPrediction = null;
    let lastPredictionTime = 0;
    const PREDICTION_HOLD_MS = 2000;

    function onResults(results) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      let now = Date.now();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];
        const flat = [];
        lm.forEach(point => flat.push(point.x, point.y, point.z));

        sequence.push(flat);
        if (sequence.length > sequenceLength) sequence.shift();

        ctx.fillStyle = "#FF3030";
        lm.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        });

        if (sequence.length === sequenceLength && !isPredicting) {
          isPredicting = true;
          fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sequence: sequence })
          })
            .then(response => response.json())
            .then(data => {
              if (data.gesture !== undefined && data.confidence !== undefined) {
                lastPrediction = data;
                lastPredictionTime = Date.now();
              } else if (data.error) {
                lastPrediction = { gesture: "Error", confidence: 0 };
                lastPredictionTime = Date.now();
              }
            })
            .catch(err => {
              lastPrediction = { gesture: "Prediction failed", confidence: 0 };
              lastPredictionTime = Date.now();
            })
            .finally(() => {
              isPredicting = false;
            });
        }

        if (lastPrediction && (now - lastPredictionTime) < PREDICTION_HOLD_MS) {
          statusRef.current.textContent = `Gesture: ${lastPrediction.gesture} (${(lastPrediction.confidence * 100).toFixed(1)}%)`;
        } else {
          statusRef.current.textContent = "Detected hand";
        }
      } else {
        statusRef.current.textContent = "No hands detected.";
        sequence.length = 0;

        if (lastPrediction && (now - lastPredictionTime) > PREDICTION_HOLD_MS) {
          lastPrediction = null;
        }
      }

      ctx.restore();
    }

    function init() {
      if (!window.Hands || !window.Camera) {
        setTimeout(init, 100);
        return;
      }

      hands = new window.Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      hands.onResults(onResults);

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 480,
        height: 360,
      });
      camera.start();
    }

    init();

    return () => {
      if (camera) camera.stop();
      document.body.removeChild(handsScript);
      document.body.removeChild(cameraScript);
    };
  }, []);

  return (
    <div className="translate-demo-wrapper">
      <div className="translate-demo-header">
        <h2>Hand Gesture Prediction Demo</h2>
        <p>
          Experience real-time hand gesture recognition powered by AI. Allow camera access and see your hand gestures recognized instantly. This demo uses MediaPipe and a custom backend for gesture prediction.
        </p>
      </div>
      <div id="container">
        <video ref={videoRef} autoPlay playsInline style={{ display: "none" }}></video>
        <canvas ref={canvasRef} width={480} height={360}></canvas>
      </div>
      <div ref={statusRef} className="status-text">Initializing...</div>
    </div>
  );
}

export default Translate;