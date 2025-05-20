from flask import Flask, request, jsonify
import os
import whisper
import yt_dlp
from datasets import load_dataset

class ASLGPC12Translator:
    def __init__(self):
        #we will have to load the dataset
        try:
            self.dataset = load_dataset('aslg_pc12')
            self.build_translation_dict()
            print(f"ASLG-PC12 translator initialized with {len(self.sentence_pairs)} sentence pairs")
        except Exception as e:
            print(f"Error loading dataset: {e}")
            self.sentence_pairs = []
            self.word_pairs = {}
    
    def build_translation_dict(self):
        #This extracts sentence pairs
        self.sentence_pairs = []
        self.word_pairs = {}
        self.phrase_pairs = {}

        #Loop ierates through all training examples where each item is a dictionary
        for item in self.dataset['train']:
            eng_text = item['text'].strip().lower()
            asl_gloss = item['gloss'].strip()
            self.sentence_pairs.append((eng_text,asl_gloss))
            eng_words = eng_text.split()
            asl_words = asl_gloss.split()

            if len(eng_words) == len(asl_words):
                for i in range(len(eng_words)):
                    eng_word = eng_words[i].lower()
                    asl_word = asl_words[i]
                    
                    #Only adds if ASL word isn't empty
                    if asl_word:
                        self.word_pairs[eng_word] = asl_word
            
            








app = Flask(__name__) #A new Flask web application instance, __name__ is a special Python variable representing name of current module
model = whisper.load_model('base')#due to limited computer mem, we will use the smallest model
@app.route('/transcribe', methods=['POST'])
def transcribe():
    video_id = request.json['videoId']
    url = f"https://www.youtube.com/watch?v={video_id}"
    filename = f"{video_id}.mp3"

    #Helps to extract audio from FFmpeg to MP3 at 192kbps quality
    ydl_opt = {
        'format': 'bestaudio/best',
        'outtmpl': filename,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    }
    with yt_dlp.YoutubeDL(ydl_opt) as ydl:
        ydl.download([url])
    result = model.transcribe(filename)
    transript = result['text']
    os.remove(filename)
    return jsonify({'transcript': transript})
if __name__ == '__main__':
    app.run(port=5000)