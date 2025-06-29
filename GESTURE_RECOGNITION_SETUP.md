# 🎯 SegnoVivo Hand Gesture Recognition Setup Guide

This guide will help you set up and use the hand gesture recognition feature in your SegnoVivo application.

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js and npm
- Webcam access
- MySQL database (for user authentication)

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Install all required Python packages
pip install -r requirements.txt
```

### 2. Start the Python Backend

```bash
# Use the startup script (recommended)
python start_backend.py

# Or manually start the server
cd Predictor
python connection.py
```

### 3. Start the React Frontend

```bash
# In a new terminal
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173 (or the port shown by Vite)
- Backend API: http://localhost:5000
- Navigate to the "Translate" page (requires login)

## 🔧 Detailed Setup

### Step 1: Install Dependencies

#### Python Dependencies
```bash
pip install opencv-python==4.8.1.78
pip install mediapipe==0.10.7
pip install tensorflow==2.13.0
pip install numpy==1.24.3
pip install pandas==2.0.3
pip install flask==2.3.3
pip install flask-cors==4.0.0
pip install flask-socketio==5.3.6
pip install python-socketio==5.8.0
```

#### Node.js Dependencies
```bash
npm install socket.io-client
```

### Step 2: Train the Model (First Time Only)

If you haven't trained the model yet:

1. **Collect Training Data**:
   ```bash
   cd Predictor
   python collecting_sign_data.py
   ```
   - Press 'r' to start recording
   - Perform the gesture
   - Press 'e' to stop recording
   - Enter the gesture name (e.g., "Love", "Thanks")

2. **Train the Model**:
   ```bash
   python train_model.py
   ```

### Step 3: Start the Backend Server

```bash
python start_backend.py
```

This script will:
- Check if all dependencies are installed
- Verify model files exist
- Start the Flask server on port 5000

### Step 4: Start the Frontend

```bash
npm run dev
```

## 🎮 How to Use

### For Users

1. **Login** to your SegnoVivo account
2. **Navigate** to the "Translate" page
3. **Check** the system status indicator:
   - 🟢 Green: Connected and ready
   - 🔴 Red: Backend not running
4. **Position** your hand in front of the camera
5. **Perform** a sign language gesture
6. **Watch** for real-time recognition results

### For Developers

#### Adding New Gestures

1. **Collect Data**:
   ```bash
   cd Predictor
   python collecting_sign_data.py
   ```

2. **Retrain Model**:
   ```bash
   python train_model.py
   ```

3. **Restart Backend**:
   ```bash
   python start_backend.py
   ```

#### Customizing the Model

- Edit `train_model.py` to modify model architecture
- Adjust `live_predict.py` for different prediction intervals
- Modify confidence thresholds in the frontend

## 🔍 Troubleshooting

### Common Issues

#### 1. "Backend not running" Error
- **Solution**: Start the Python backend server
- **Command**: `python start_backend.py`

#### 2. "Missing model files" Error
- **Solution**: Train the model first
- **Command**: `python Predictor/train_model.py`

#### 3. WebSocket Connection Failed
- **Check**: Backend is running on port 5000
- **Check**: No firewall blocking the connection
- **Check**: CORS settings in `connection.py`

#### 4. Camera Not Working
- **Check**: Camera permissions in browser
- **Check**: Camera is not being used by another application
- **Check**: Webcam is properly connected

#### 5. Low Recognition Accuracy
- **Solution**: Collect more training data
- **Solution**: Ensure good lighting conditions
- **Solution**: Keep hand clearly visible in camera

### Debug Mode

Enable debug logging in the backend:
```python
# In connection.py, change:
socketio.run(app, debug=True)
```

## 📁 File Structure

```
SegnoVivo/
├── Predictor/
│   ├── connection.py          # Flask server
│   ├── live_predict.py        # Real-time prediction
│   ├── collecting_sign_data.py # Data collection
│   ├── train_model.py         # Model training
│   ├── gesture_model.h5       # Trained model
│   ├── label_map.npy          # Gesture labels
│   └── sequence_data/         # Training data
├── src/
│   ├── pages/
│   │   └── translate.jsx      # Main translate page
│   └── components/
│       └── LivePredictionDisplay.jsx # Real-time display
├── start_backend.py           # Startup script
└── requirements.txt           # Python dependencies
```

## 🔧 Configuration

### Backend Configuration

Edit `Predictor/connection.py`:
```python
# Change port (default: 5000)
socketio.run(app, debug=True, port=5000)

# Enable/disable CORS
CORS(app, origins=["http://localhost:5173"])
```

### Frontend Configuration

Edit `src/components/LivePredictionDisplay.jsx`:
```javascript
// Change backend URL
const socket = io("http://localhost:5000");

// Adjust confidence thresholds
const getConfidenceColor = (conf) => {
  if (conf > 0.8) return '#28a745'; // High confidence
  if (conf > 0.6) return '#ffc107'; // Medium confidence
  return '#dc3545'; // Low confidence
};
```

## 🚀 Production Deployment

### Backend Deployment

1. **Use a production WSGI server**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker connection:app
   ```

2. **Set up environment variables**:
   ```bash
   export FLASK_ENV=production
   export FLASK_DEBUG=0
   ```

### Frontend Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to your hosting service** (Vercel, Netlify, etc.)

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check the Python terminal for backend errors
3. Verify all dependencies are installed
4. Ensure the model files exist
5. Check network connectivity between frontend and backend

## 🎯 Next Steps

- Add more gesture recognition capabilities
- Implement gesture-to-text translation
- Add support for sentence formation
- Integrate with speech synthesis
- Add gesture recording and playback features 