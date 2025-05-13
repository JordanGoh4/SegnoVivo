import cv2 #Library that accesses webcam
import mediapipe as mp #Google's library for real-time computer vision

mp_hands = mp.solutions.hands #Am accessing the submodule of solutions containing ready-made AI models, in this case hand tracking is chosen
hands = mp_hands.Hands(max_num_hands = 1) #I am creating a Hand object with parameter being the number of hands captured
mp_draw = mp.solutions.drawing_utils #Used to draw the landmarks and the connections since we have to see it on the screen

cap = cv2.VideoCapture(0)#This tells us to use the default webcam
while True:
    ret, frame = cap.read() #frame will be stored as a Numpy Array if captured successfully. cap.read() returns 2 objects
    if not ret:
        break
    
    frame = cv2.flip(frame,1) #flips the frame so it becomes a mirror image
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) #Converts colour from BGR(from cv2) to RGB(Mediapipe)
    results = hands.process(rgb_frame) #process is a method provided by the Hands class that analyses image frame, detects hands and returns structured data about what it finds

    if results.multi_hand_landmarks: #Mediapipe returns a results object with field called multi_hand_landmarks that is a list if it detecdts hands, each item = 1 hand
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)#1st is image to draw on, 2nd is the 21 points of the hand, 3 is lines that connects the points

    cv2.imshow("Hand Tracker", frame) #Shows the video frame together with the drawings
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()



