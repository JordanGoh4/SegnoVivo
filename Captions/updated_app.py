from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import whisper
import yt_dlp
import nltk
from nltk.tokenize import sent_tokenize
import uuid
import json
import time
import asyncio
from aslgpc12_translator import ASLGPC12Translator
from avatar_generator import OpenSourceAvatarGenerator

nltk.download('punkt', quiet=True)

translator = ASLGPC12Translator()
avatar_generator = OpenSourceAvatarGenerator()

app = Flask(__name__)
CORS(app)

os.makedirs('static/animations', exist_ok=True)
os.makedirs('data', exist_ok=True)

model = whisper.load_model('base')

@app.route('/static/animations/<path:filename>')
def serve_animation(filename):
    return send_from_directory('static/animations', filename)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    video_id = request.json['videoId']
    url = f"https://www.youtube.com/watch?v={video_id}"
    filename = f"{video_id}.mp3"

    ydl_opt = {
        'format': 'bestaudio/best',
        'outtmpl': filename,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opt) as ydl:
            ydl.download([url])

        result = model.transcribe(filename)
        transcript = result['text']
        segments = result.get('segments', [])

        asl_segments = []
        if segments:
            for segment in segments:
                text = segment['text']
                start = segment['start']
                end = segment['end']

                asl_gloss = translator.to_gloss(text)

                asl_segments.append({
                    "start": start,
                    "end": end,
                    "english": text,
                    "asl_gloss": asl_gloss
                })
        else:
            sentences = sent_tokenize(transcript)
            for sentence in sentences:
                asl_gloss = translator.to_gloss(sentence)

                asl_segments.append({
                    "english": sentence,
                    "asl_gloss": asl_gloss
                })

        os.remove(filename)

        return jsonify({
            'transcript': transcript,
            'asl_segments': asl_segments
        })

    except Exception as e:
        if os.path.exists(filename):
            os.remove(filename)
        return jsonify({'error': str(e)}), 500

@app.route('/generate-avatar', methods=['POST'])
def generate_avatar():
    try:
        data = request.get_json()
        text = data.get('asl_gloss')
        method = data.get('method', 'mediapipe')

        if not text:
            return jsonify({"error": "ASL gloss is required"}), 400

        asl_gloss = translator.to_gloss(text)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        avatar_result = loop.run_until_complete(
            avatar_generator.generate_avatar_animation(asl_gloss, method)
        )

        animation_id = str(uuid.uuid4())
        animation_path = f"static/animations/{animation_id}.json"

        response_data = {
            "asl_gloss": asl_gloss,
            "animation_id": animation_id,
            "generation_method": "open_source_mediapipe",
            "animation_data": avatar_result.get("data", {}),
            "created_at": time.time(),
            "libraries": ["MediaPipe", "OpenCV", "NumPy"],
            "open_source": True
        }

        with open(animation_path, 'w') as f:
            json.dump(response_data, f, indent=2)

        return jsonify({
            "success": avatar_result.get("success", True),
            "animation_url": f"/static/animations/{animation_id}.json",
            "animation_id": animation_id,
            "method": "open_source_mediapipe",
            "message": "Avatar generated using open-source libraries",
            "asl_gloss": asl_gloss,
            "data": avatar_result.get("data", {}),
            "libraries_used": ["MediaPipe", "OpenCV", "NumPy"],
            "real_time_capable": True
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/get-pose-database', methods=['GET'])
def get_pose_database():
    available_signs = list(avatar_generator.asl_poses.keys())
    handshapes = list(avatar_generator.asl_handshapes.keys())

    return jsonify({
        "available_signs": available_signs,
        "total_signs": len(available_signs),
        "handshapes": handshapes,
        "capabilities": {
            "known_signs": "Full pose animation",
            "unknown_words": "Fingerspelling animation",
            "coordinate_system": "MediaPipe normalized (0-1)",
            "frame_rate": "30 FPS",
            "real_time": True
        },
        "libraries": {
            "mediapipe": "Hand, pose, and face detection",
            "opencv": "Computer vision processing", 
            "numpy": "Mathematical computations"
        }
    })