import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import os

model = tf.keras.models.load_model('gesture_model.h5')
'''
np.load() loads NumPy file containing a dictionary that maps numeric prediction indices to human readable
gesture labels
allow_pickle=True permits loading arrays containing Python objects. Needed becayse label map isn't a simple
simple array but a dictionary object saved in Numpy format.
'''
label_map = np.load('label_map.npy', allow_pickle=True).item()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands = 1)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)
recording = False
current_sequence = []
max_sequence_length = model.input_shape[1]
print("Press 'r' to start recording a gesture, 'e' to predict and 'q' to quit.")

while True:
    ret,frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame,1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            landmarks = []
            for lm in hand_landmarks.landmark:
                landmarks+=[lm.x,lm.y,lm.z] #flattens 21 landmarks with 3 coordinates per landmark
            if recording:
                current_sequence.append(landmarks)#If recording will place thje landmarks from this frame into sequence
    
    if recording:
        cv2.putText(frame, "Recording...", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255),2)
    cv2.imshow("Live Prediction", frame)
    key = cv2.waitKey(1) & 0xFF

