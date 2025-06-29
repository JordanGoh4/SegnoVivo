import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import time
import socketio

# WebSocket client
sio = socketio.Client()

try:
    sio.connect("http://localhost:5001")
    print("✅ Connected to WebSocket server.")
except Exception as e:
    print("❌ Could not connect to WebSocket server:", e)

def send_prediction(gesture, confidence):
    print(f"📡 SENDING: {gesture} ({confidence:.2f})")
    sio.emit("prediction", {
        "gesture": gesture,
        "confidence": confidence
    })

# Load model and config
model = tf.keras.models.load_model('gesture_model.h5')
label_map = np.load('label_map.npy', allow_pickle=True).item()
max_sequence_length = model.input_shape[1]

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

frame_buffer = []
buffer_size = 30
prediction_interval = 10
frame_count = 0
last_prediction = "None"
confidence_score = 0.0
prediction_threshold = 0.1

print("🎥 Live prediction started. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            landmarks = []
            for lm in hand_landmarks.landmark:
                landmarks += [lm.x, lm.y, lm.z]
            frame_buffer.append(landmarks)
            if len(frame_buffer) > buffer_size:
                frame_buffer.pop(0)

    frame_count += 1
    if frame_count % prediction_interval == 0 and len(frame_buffer) >= 15:
        sequence = np.array(frame_buffer)
        if len(sequence) < max_sequence_length:
            padding = np.zeros((max_sequence_length - len(sequence), sequence.shape[1]))
            sequence = np.vstack((sequence, padding))
        else:
            sequence = sequence[-max_sequence_length:]
        sequence = np.expand_dims(sequence, axis=0)

        predictions = model.predict(sequence, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence_score = predictions[0][predicted_index]

        if confidence_score > prediction_threshold:
            if predicted_index in label_map:
                last_prediction = label_map[predicted_index]
            else:
                last_prediction = f"Unknown-{predicted_index}"
            send_prediction(last_prediction, float(confidence_score))

    cv2.putText(frame, f"Gesture: {last_prediction}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Confidence: {confidence_score:.2f}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    cv2.imshow("Live Prediction", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    time.sleep(0.01)

cap.release()
cv2.destroyAllWindows()
sio.disconnect()