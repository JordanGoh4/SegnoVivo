import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function LivePredictionDisplay() {
  const [gesture, setGesture] = useState('None');
  const [confidence, setConfidence] = useState(0.0);

  useEffect(() => {
    const socket = io('http://localhost:5001');

    socket.on('connect', () => {
      console.log('✅ React connected to backend WebSocket');
    });

    socket.on('prediction', (data) => {
      console.log('📥 RECEIVED:', data);
      setGesture(data.gesture);
      setConfidence(data.confidence);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="prediction-output">
      <p><strong>Detected Gesture:</strong> {gesture}</p>
      <p><strong>Confidence:</strong> {confidence.toFixed(2)}</p>
    </div>
  );
}

export default LivePredictionDisplay;