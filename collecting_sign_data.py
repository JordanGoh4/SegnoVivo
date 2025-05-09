import cv2
import mediapipe as mp
import csv #converting the data into a .csv file
import os 

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands = 1)
mp_draw = mp.solutions.drawing_utils

output_file = 'sign_data.csv'
file_exists = os.path.isfile(output_file) #helps to check if file already exists

#with is a context manager that automatically handles closing file when done with it
with open(output_file, mode='a', newline='') as f: #open() has 2 para, file to open and the mode parameter
    csv_writer = csv.writer(f) #creates an object that simplifies writing structured data to a CSV file

if not file_exists:
    headers = [] #Names the columns in CSV like x0, y0 etc etc
    for i in range(21):
        headers += [f'x{i}', f'y{i}', f'z{i}']
    headers.append('label') #Adds the corresponding hand representations when we start saving the data
    csv_writer.writerow(headers) #Tells program to write one row with the contents of headers

cap=cv2.VideoCapture(0)
print("Press 's' to save frame with label. Press 'q' to quit")

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
            
            key= cv2.waitKey(1) & 0xFF#0xFF ensures that the key code works on all systems
            if key == ord('s'):
                cv2.destroyAllWindows()
                label = input("Enter label for this gesture: ").strip()
                csv_writer.writerow(landmarks + [label])
                print(f"Saved: {label}")
                cap =cv2.VideoCapture(0)
    cv2.imshow("Data Collection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
