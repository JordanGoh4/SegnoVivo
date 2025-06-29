from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import numpy as np
import tensorflow as tf

# Initialize app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Load model and label map
model = tf.keras.models.load_model('gesture_model.h5')
label_map = np.load('label_map.npy', allow_pickle=True).item()
max_sequence_length = model.input_shape[1]

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    sequence = np.array(data['sequence'])
    if len(sequence) < max_sequence_length:
        padding = np.zeros((max_sequence_length - len(sequence), sequence.shape[1]))
        sequence = np.vstack((sequence, padding))
    else:
        sequence = sequence[-max_sequence_length:]
    sequence = np.expand_dims(sequence, axis=0)

    prediction = model.predict(sequence, verbose=0)
    predicted_index = int(np.argmax(prediction[0]))
    confidence = float(prediction[0][predicted_index])
    gesture = label_map.get(predicted_index, "Unknown")

    return jsonify({"gesture": gesture, "confidence": confidence})

@socketio.on('connect')
def on_connect():
    print("✅ Frontend connected via WebSocket")

@socketio.on("prediction")
def on_prediction(data):
    gesture = data.get("gesture", "None")
    confidence = data.get("confidence", 0.0)
    print(f"📥 RECEIVED from live_predict.py: {gesture} ({confidence:.2f})")
    emit("prediction", {"gesture": gesture, "confidence": confidence}, broadcast=True)

def emit_prediction(gesture, confidence):
    print(f"🌐 EMITTING to frontend: {gesture} ({confidence:.2f})")
    socketio.emit("prediction", {
        "gesture": gesture,
        "confidence": confidence
    })

if __name__ == '__main__':
    print("🔌 Running backend on http://0.0.0.0:5001")
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)