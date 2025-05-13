import cv2 
import mediapipe as mp 
import numpy as np 
import tensorflow as tf 
import os  

model = tf.keras.models.load_model('gesture_model.h5') 
''' 
np.load() loads NumPy file containing a dictionary that maps numeric prediction indices to human readable gesture labels 
allow_pickle=True permits loading arrays containing Python objects. Needed becayse label map isn't a simple simple array but a dictionary object saved in Numpy format. 
''' 
label_map = np.load('label_map.npy', allow_pickle=True).item()  

# Debug: print the label map to verify it loaded correctly
print("Loaded label map:")
print(label_map)

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
                current_sequence.append(landmarks) #If recording will place the landmarks from this frame into sequence          
    
    if recording:         
        cv2.putText(frame, "Recording...", (10,30),                     
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255),2)     
    cv2.imshow("Live Prediction", frame)     
    key = cv2.waitKey(1) & 0xFF      
    
    if key == ord('r'):         
        print("Started Recording")         
        recording = True         
        current_sequence = []     
    elif key == ord('e') and recording:         
        print("Stopped recording")         
        recording = False         
        sequence = np.array(current_sequence)         
        if len(sequence) < max_sequence_length:             
            padding = np.zeros((max_sequence_length - len(sequence), sequence.shape[1]))             
            sequence = np.vstack((sequence, padding))         
        else:             
            sequence = sequence[:max_sequence_length]                  
        '''         
        Batch dimension represents how many examples are being processed simultaneously by neural network         
        code below adds a batch dimension to the array to [1,time,features]         
        Needed since Neural networks expect inputs in batches         
        '''         
        sequence = np.expand_dims(sequence, axis=0)         
        
        predictions = model.predict(sequence) #Returns an array of probabilities for gesture types         
        predicted_index = np.argmax(predictions[0]) #argmax finds the index of highest probability
        confidence = predictions[0][predicted_index]
        
        print(f"Prediction array: {predictions[0]}")
        print(f"Predicted index: {predicted_index}, Confidence: {confidence:.4f}")
        
        # Get the gesture name from our label map
        if predicted_index in label_map:
            predicted_label = label_map[predicted_index]
            print(f"Predicted Gesture: {predicted_label} (Confidence: {confidence:.4f})")
        else:
            print(f"Unknown gesture with index {predicted_index}")
        
        # Display prediction on the frame
        if predicted_index in label_map:
            cv2.putText(frame, f"Gesture: {predicted_label}", (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        else:
            cv2.putText(frame, f"Unknown Gesture", (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
        cv2.imshow("Live Prediction", frame)
        cv2.waitKey(1500)  # Show for 1.5 seconds
        
        current_sequence = [] #Cleans the current sequence after prediction to prepare for a new recording     
    elif key == ord('q'):         
        break 

cap.release() 
cv2.destroyAllWindows()