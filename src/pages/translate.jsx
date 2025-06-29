import { useAuth } from '../services/AuthContext';
import '../css/Translate.css';
import LivePredictionDisplay from '../components/LivePredictionDisplay';  

function Translate() {
  const { user } = useAuth();

  return (
    <div className="translate-container">
      <h1>Sign Language Translation</h1>
      <p>Welcome, {user?.user?.username || 'User'}! This is the protected translate page.</p>
      <p>Here you can use our sign language translation features.</p>
      
      <div className="translation-section">
        <h2>Real-time Translation</h2>
        <p>This feature will be implemented to provide real-time sign language translation.</p>
        
        <div className="camera-section">
          <h3>Camera Access</h3>
          <p>Allow camera access to start translation</p>
          <button className="camera-btn">Start Camera</button>

          {/* Real-time prediction display */}
          <LivePredictionDisplay />

          {/* Webcam placeholder box */}
          <div className="camera-box">
            <p><strong>(Webcam view is handled on backend)</strong></p>
            <div className="fake-camera-box">
              <p>[ Webcam active on backend ]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translate;