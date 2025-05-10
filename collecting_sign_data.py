import cv2
import mediapipe as mp
import csv #converting the data into a .csv file
import os 

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands = 1)
mp_draw = mp.solutions.drawing_utils

output_dir = 'sequence_data'
os.makedirs(output_dir, exist_ok=True)
cap = cv2.VideoCapture(0)
recording = False
current_sequence = []

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
            for lm in hand_landmarks.landmark: #Loops through each of the 21 key points on the hand
                landmarks += [lm.x, lm.y, lm.z]
            if recording:
                current_sequence.append(landmarks)
    
    if recording:
        cv2.putText(frame, "Recording...", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2) #Displays text 10 px from left and 30 px from top, 1 = font-size, 2 refers to thickness
    
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
        current_sequence = []

        # Reopen the webcam after labeling
        cap = cv2.VideoCapture(0)
        print("Press 'r' to start recording, 'e' to stop and save, 'q' to quit")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()