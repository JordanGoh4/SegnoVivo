The main features of SegnoVivo are split into 2, Captions and Predictor.

Captions:
The captions are made up of the layers below:

1. Chrome Extension -> Quick settings with a popup UI, grabs Youtube audio and then overalys the live ASL captions with 3D signing avatar on-page
   Files involved: popup.html, popup.js, content.js, manifest.json
   Key tech involved: HTML/CSS/JS, Chrome MV3 APIs

2. Python Backend -> Using Whisper from OpenAI for speech transcription of Youtube videos(For now only Youtube videos), then English to ASL gloss translation, before the avatar animation generation
   Files involved: app.py
   Key tech involved: Flask, Whisper, MediaPipe, OpenCV, NumPy

3. Dataset Loader -> Downloads and unifies data from research datasets (Set these few for now WLASL, ASLLVD, MS-ASL, How2Sign, ASL-LEX) Also note that we have yet to downlaod these datasets to be included into the files
   Files involved: pose_database.py
   Key tech involved: pandas, requests

4. Avatar Generator: Builds pose sequences from datasets mentioned above, else fallse back to fingerspelling if no words can be found
   Files involved: avatar_generator.py
   Key tech involved: MediaPipe, OpenCV

5. ASL Translator -> Converts English into ASL gloss
   Files involved: asl_translator.py

Extension workflow:
1.In main popup, can toggle between start intepreter and the other options
2.content.js injection:
videos are transcribed using YouTube video ID, which will then receive segment-level English + ASL gloss. For each segment, will then fetch /generate-avatar to obtain a frame-by-frame JSON animation.
3.pose_database.py makes sures that the avatar is driven by real dataset-key points whenever available, else will fall back to fingerspelling

All of these above are kept in sync with the video via timeupdate listeners

Library installations needed for testing(macOS):
1.Installing of Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
2.Installing ffmpeg: brew install ffmpeg
3.Installing python (Note that MediaPipe currently only supports below Python 3.13)

Also need to install Flask, Flask-CORS, Torch, OpenAI Whisper, Mediapipe, OpenCV, NumPy, Pandas, Requests, yt-dlp, nltk, datasets(For HuggingFace if utilised)

pip install flask flask-cors torch \
 git+https://github.com/openai/whisper.git \
 mediapipe==0.10.9 opencv-python numpy pandas requests yt-dlp nltk datasets


Setting of Python Virtual Environment
1.Cloning of Project: git clone https://github.com/YOUR_USERNAME/sign-avatar-cc.git
cd sign-avatar-cc
2.Creating and activating virtual environment: python3 -m venv venv
source venv/bin/activate
3.Installing Python dependencies: pip install -r requirements.txt

Running of backend API:
Running python app.py should show you:
🚀 Server starting at: http://localhost:5000
📊 Health check: http://localhost:5000/health

Loading up of Chrome Extension:
Open Chrome and go to extensions, enable developer mode, click load unpacked and select the file. Then go to Youtube, click the extension and press Start Intepreter.

The datasets to download once the script has no problem
Dataset
Instructions file
Where to download
WLASL
data/wlasl_instructions.txt
https://dxli94.github.io/WLASL/
ASL-LEX
data/asl_lex_instructions.txt
https://asl-lex.org/
MS-ASL
data/ms_asl_instructions.txt
https://www.microsoft.com/en-us/research/project/ms-asl/
ASLLVD
data/asllvd_instructions.txt
http://www.bu.edu/asllrp/av/dai-asllvd.html
How2Sign
data/how2sign_instructions.txt
https://how2sign.github.io/

Predictor:
collecting_sign_data.py: Records hand landmark gestures for us to label gestures to train up the model
train_model.py: Trains an LSTM model on collecting sequence3s and generates a gesture_model.h5 and label_map,npy
live_predict.py: Runs the real-time prediction
check_label_map.pyL Debugs to verify integrity and contents of the label map

This predictor also needs the tensorflow library

Usage:
Running python collecting_sign_data.py starts the data collection, r to record, e to stop and label the sequence, and q to quit
Data will then be stored in the sequence_data file.

After that, running python train_model.py will load all the sequences in sequence_data, pad them to uniform length, and then train an LSTM Model.
Currently, I have only trained 2 gestures so we got to train it up more before we submit. Also we cannot just add on to the dataset after training the model, we got to make sure all data is trained befire we run the train_model file if not we need to delete the sequence_data file and start over again.

python live_predict.py runs the live predictor


For User (Database):
1.To start frontend: Run npm install
2.Create .env file with the following content:
DB_HOST='localhost'
DB_USER='{Your user}'
DB_PASS='{Your Password}'
DB_NAME='{Your database name}'
JWT_SECRET='{Secret}'
3.Download MYSQL Workbench and create a database with the root user that will be shown during installation.
4.Input the username and relevant information into .env file


First time setting up backend (Sign Language Model):
Run the following line of command in the terminal to download the required library for the predictor. Additional note that you will have to run Python 3.11.4 as Tensorflow currently supports till 3.11.4 only.

python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt


Once everything has been set up before, below are the steps required:
1. python connection.py
2. python live_predict.py
3. npm run dev
4. node server.js
