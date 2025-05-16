from flask import Flask, request, jsonify
import os
import whisper
import yt_dlp

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