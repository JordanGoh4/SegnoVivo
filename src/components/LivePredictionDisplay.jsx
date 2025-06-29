import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000"); 

function LivePredictionDisplay() {
  const [gesture, setGesture] = useState("None");
  const [confidence, setConfidence] = useState(0.0);
  const [isConnected, setIsConnected] = useState(false);
  const [isBackendRunning, setIsBackendRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("prediction", (data) => {
      setGesture(data.gesture);
      setConfidence(data.confidence);
      setLastUpdate(new Date());
      setIsBackendRunning(true);
    });

    // Check if backend is running by trying to connect
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: [] })
        });
        setIsBackendRunning(true);
      } catch (error) {
        setIsBackendRunning(false);
      }
    };

    checkBackend();

    return () => {
      socket.disconnect();
    };
  }, []);

  const getConfidenceColor = (conf) => {
    if (conf > 0.8) return '#28a745'; // Green for high confidence
    if (conf > 0.6) return '#ffc107'; // Yellow for medium confidence
    return '#dc3545'; // Red for low confidence
  };

  const getStatusMessage = () => {
    if (!isBackendRunning) {
      return "Backend not running. Please start the Python server.";
    }
    if (!isConnected) {
      return "Connecting to gesture recognition server...";
    }
    return "Connected and ready for gesture recognition!";
  };

  return (
    <div className="prediction-display">
      <div className="status-section">
        <h3>System Status</h3>
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {getStatusMessage()}
        </div>
      </div>

      <div className="prediction-section">
        <h3>Live Gesture Recognition</h3>
        <div className="prediction-output">
          <div className="gesture-display">
            <span className="gesture-label">Detected Gesture:</span>
            <span className="gesture-value">{gesture}</span>
          </div>
          <div className="confidence-display">
            <span className="confidence-label">Confidence:</span>
            <span 
              className="confidence-value" 
              style={{ color: getConfidenceColor(confidence) }}
            >
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          {lastUpdate && (
            <div className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="instructions">
        <h3>How to Use</h3>
        <ol>
          <li>Make sure the Python backend is running</li>
          <li>Position your hand in front of the camera</li>
          <li>Perform a sign language gesture</li>
          <li>Watch for real-time recognition results</li>
        </ol>
      </div>
    </div>
  );
}

export default LivePredictionDisplay;