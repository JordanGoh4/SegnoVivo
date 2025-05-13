import cv2 
import mediapipe as mp 
import numpy as np 
import tensorflow as tf 
import os
import time  # Added for frame rate control

model = tf.keras.models.load_model('gesture_model.h5') 
''' 
np.load() loads NumPy file containing a dictionary that maps numeric prediction indices to human readable gesture labels 
allow_pickle=True permits loading arrays containing Python objects. Needed becayse label map isn't a simple simple array but a dictionary object saved in Numpy format. 
''' 
label_map = np.load('label_map.npy', allow_pickle=True).item()  

print("Loaded label map:")
print(label_map)

mp_hands = mp.solutions.hands 
hands = mp_hands.Hands(max_num_hands = 1) 
mp_draw = mp.solutions.drawing_utils  

cap = cv2.VideoCapture(0) 

# Parameters for continuous prediction
frame_buffer = []  # Store recent frames for prediction
buffer_size = 30   # Number of frames to keep in buffer (adjust as needed)
max_sequence_length = model.input_shape[1]
prediction_interval = 10  # Predict every N frames
frame_count = 0
last_prediction = "None"
confidence_score = 0.0
prediction_threshold = 0.5  # Minimum confidence to display a prediction

print("Continuous prediction mode. Press 'q' to quit.")

while True:     
    ret, frame = cap.read()     
    if not ret:         
        break     
    
    frame = cv2.flip(frame, 1)     
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)     
    results = hands.process(rgb_frame)      
    
    # Process hand landmarks if detected
    if results.multi_hand_landmarks:         
        for hand_landmarks in results.multi_hand_landmarks:             
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)             
            landmarks = []             
            for lm in hand_landmarks.landmark:                 
                landmarks += [lm.x, lm.y, lm.z] #flattens 21 landmarks with 3 coordinates per landmark
            
            # Add to buffer for continuous prediction
            frame_buffer.append(landmarks)
            # Keep buffer at fixed size
            if len(frame_buffer) > buffer_size:
                frame_buffer.pop(0)
    
    # Make a prediction every prediction_interval frames if we have enough data
    frame_count += 1
    if frame_count % prediction_interval == 0 and len(frame_buffer) >= 15:  # Need a minimum amount of frames
        # Prepare sequence for prediction
        sequence = np.array(frame_buffer)
        
        # Pad or trim sequence to match model's expected length
        if len(sequence) < max_sequence_length:
            padding = np.zeros((max_sequence_length - len(sequence), sequence.shape[1]))
            sequence = np.vstack((sequence, padding))
        else:
            sequence = sequence[-max_sequence_length:]  # Take the most recent frames
        
        # Add batch dimension
        sequence = np.expand_dims(sequence, axis=0)
        
        # Get prediction
        predictions = model.predict(sequence, verbose=0)  # Use verbose=0 to suppress output
        predicted_index = np.argmax(predictions[0])
        confidence_score = predictions[0][predicted_index]
        
        # Only update prediction if confidence is above threshold
        if confidence_score > prediction_threshold:
            if predicted_index in label_map:
                last_prediction = label_map[predicted_index]
            else:
                last_prediction = f"Unknown-{predicted_index}"
    
    # Display the current prediction on the frame
    cv2.putText(frame, f"Gesture: {last_prediction}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Confidence: {confidence_score:.2f}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    
    # Display the frame
    cv2.imshow("Live Prediction", frame)     
    
    # Check for exit command
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):         
        break 
    
    # Optional: Add a slight delay to reduce CPU usage
    time.sleep(0.01)

cap.release() 
cv2.destroyAllWindows()