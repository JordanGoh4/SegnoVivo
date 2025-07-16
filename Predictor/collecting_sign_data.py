import cv2
import mediapipe as mp
import csv
import os
import numpy as np

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands = 1)
mp_draw = mp.solutions.drawing_utils

output_dir = 'sequence_data'
os.makedirs(output_dir, exist_ok=True)
cap = cv2.VideoCapture(0)
recording = False
current_sequence = []

label_map_file = 'label_map.npy'
if os.path.exists(label_map_file):
    try:
        label_map = np.load(label_map_file, allow_pickle=True).item()
        print(f"Loaded existing label map with {len(label_map)} labels")
    except:
        label_map = {}
        print("Created new label map")
else:
    label_map = {}
    print("Created new label map")

print("Press 'r' to start recording, 'e' to stop and save, 'q' to quit")

while True:
    ret, frame = cap.read()
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
                landmarks += [lm.x, lm.y, lm.z]
            if recording:
                current_sequence.append(landmarks)
    
    if recording:
        cv2.putText(frame, "Recording...", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2) 
    
    cv2.imshow("Sequence Collector", frame)
    key = cv2.waitKey(1) & 0xFF

    if key == ord('r'):
        print("Start recording sequence.")
        recording = True
        current_sequence = []
    
    elif key == ord('e') and recording:
        recording = False

        cap.release()
        cv2.destroyAllWindows()

        label = input("Enter label for this sequence: ").strip()
        sequence_file = os.path.join(output_dir, f"{label}_{len(os.listdir(output_dir))}.csv")

        with open(sequence_file, mode='w', newline='') as f:
            csv_writer = csv.writer(f)
            for frame_landmarks in current_sequence:
                csv_writer.writerow(frame_landmarks + [label])

        print(f"Saved sequence as {sequence_file}")
        
    
        label_exists = False
        for idx, name in label_map.items():
            if name == label:
                label_exists = True
                break
                

        if not label_exists:
            new_idx = len(label_map)
            label_map[new_idx] = label
            print(f"Added new label '{label}' with index {new_idx} to label map")
            # Save the updated label map
            np.save(label_map_file, label_map)
            print(f"Saved updated label map: {label_map}")

        current_sequence = []

    
        cap = cv2.VideoCapture(0)
        print("Press 'r' to start recording, 'e' to stop and save, 'q' to quit")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

if label_map:
    np.save(label_map_file, label_map)
    print(f"Final label map saved: {label_map}")
