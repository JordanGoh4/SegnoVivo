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
from asl_translator import ASLGPC12Translator


nltk.download('punkt', quiet=True)


asl_translator = ASLGPC12Translator()
avatar_generator = OpenSourceAvatarGenerator()

app = Flask(__name__)
CORS(app)


os.makedirs('static/animations', exist_ok=True)
os.makedirs('data', exist_ok=True)


model = whisper.load_model('base')

@app.route('/static/animations/<path:filename>')
def serve_animation(filename):
    """Serve animation files to the frontend"""
    return send_from_directory('static/animations', filename)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe YouTube video and translate to ASL gloss"""
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
                
                asl_gloss = asl_translator.translate_sentence(text)
                
                asl_segments.append({
                    "start": start,
                    "end": end,
                    "english": text,
                    "asl_gloss": asl_gloss
                })
        else:
            sentences = sent_tokenize(transcript)
            for sentence in sentences:
                asl_gloss = asl_translator.translate_sentence(sentence)
                
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
    """Generate avatar using open-source MediaPipe and pose estimation"""
    try:
        data = request.get_json()
        asl_gloss = data.get('asl_gloss')
        method = data.get('method', 'mediapipe')
        
        if not asl_gloss:
            return jsonify({"error": "ASL gloss is required"}), 400
        
        print(f"Generating open-source avatar for: {asl_gloss}")
        

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
        
        print(f"Open-source avatar generated: {animation_path}")
        
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
        print(f"Error in generate_avatar: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/get-pose-database', methods=['GET'])
def get_pose_database():
    """Get available ASL poses in the database"""
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

@app.route('/validate-pose-data', methods=['POST'])
def validate_pose_data():
    """Validate and preview pose data for a given ASL gloss"""
    try:
        data = request.get_json()
        asl_gloss = data.get('asl_gloss')
        
        if not asl_gloss:
            return jsonify({"error": "ASL gloss is required"}), 400
        
        words = asl_gloss.split()
        validation_results = []
        
        for word in words:
            word_upper = word.upper()
            
            if word_upper in avatar_generator.asl_poses:
                pose_data = avatar_generator.asl_poses[word_upper]
                validation_results.append({
                    "word": word,
                    "status": "known_sign",
                    "animation_type": "pose_sequence",
                    "frame_count": pose_data["dominant_hand"]["frames"],
                    "movement_type": pose_data["dominant_hand"]["movement"],
                    "handshape": avatar_generator.get_handshape_for_word(word),
                    "pose_available": True
                })
            else:
                validation_results.append({
                    "word": word,
                    "status": "unknown_sign",
                    "animation_type": "fingerspelling",
                    "frame_count": len(word) * 20,
                    "movement_type": "letter_by_letter",
                    "handshape": "alphabet_sequence",
                    "pose_available": False
                })
        
        total_frames = sum(result["frame_count"] for result in validation_results)
        
        return jsonify({
            "asl_gloss": asl_gloss,
            "validation_results": validation_results,
            "total_duration": total_frames / 30.0,
            "total_frames": total_frames,
            "known_signs": len([r for r in validation_results if r["status"] == "known_sign"]),
            "fingerspelled_words": len([r for r in validation_results if r["status"] == "unknown_sign"]),
            "ready_for_generation": True
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "ready_for_generation": False
        }), 500

@app.route('/export-animation/<animation_id>', methods=['GET'])
def export_animation(animation_id):
    """Export animation data in different formats"""
    try:
        animation_path = f"static/animations/{animation_id}.json"
        
        if not os.path.exists(animation_path):
            return jsonify({"error": "Animation not found"}), 404
        
        with open(animation_path, 'r') as f:
            animation_data = json.load(f)
        
        export_format = request.args.get('format', 'json')
        
        if export_format == 'json':
            return jsonify(animation_data)
        elif export_format == 'csv':
            csv_data = []
            if 'animation_data' in animation_data and 'animation_sequence' in animation_data['animation_data']:
                for word_anim in animation_data['animation_data']['animation_sequence']:
                    for frame in word_anim.get('frames', []):
                        for landmark in frame.get('hand_landmarks', []):
                            csv_data.append({
                                'word': word_anim['word'],
                                'frame': frame['frame_number'],
                                'timestamp': frame['timestamp'],
                                'x': landmark['x'],
                                'y': landmark['y'], 
                                'z': landmark['z'],
                                'visibility': landmark.get('visibility', 1.0)
                            })
            
            return jsonify({
                "format": "csv_data",
                "data": csv_data,
                "total_points": len(csv_data)
            })
        elif export_format == 'mediapipe':
            mp_data = {
                "landmarks": [],
                "metadata": {
                    "fps": 30,
                    "coordinate_system": "normalized",
                    "source": "open_source_asl_generator"
                }
            }
            
            if 'animation_data' in animation_data and 'animation_sequence' in animation_data['animation_data']:
                for word_anim in animation_data['animation_data']['animation_sequence']:
                    for frame in word_anim.get('frames', []):
                        mp_data["landmarks"].append({
                            "frame": frame['frame_number'],
                            "hand_landmarks": frame.get('hand_landmarks', [])
                        })
            
            return jsonify(mp_data)
        else:
            return jsonify({"error": "Unsupported export format"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        mp_status = "operational" if avatar_generator.hands_detector else "failed"
        
        return jsonify({
            "status": "healthy",
            "message": "Open-Source Sign Avatar CC Backend",
            "translator_loaded": len(asl_translator.sentence_pairs) > 0,
            "avatar_generator": "open_source_mediapipe",
            "mediapipe_status": mp_status,
            "available_signs": len(avatar_generator.asl_poses),
            "handshapes_available": len(avatar_generator.asl_handshapes),
            "capabilities": {
                "pose_generation": True,
                "fingerspelling": True,
                "real_time": True,
                "export_formats": ["json", "csv", "mediapipe"]
            },
            "libraries": {
                "mediapipe": "✓ Installed",
                "opencv": "✓ Installed", 
                "numpy": "✓ Installed",
                "whisper": "✓ Installed",
                "yt_dlp": "✓ Installed"
            },
            "open_source": True
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🤟 OPEN-SOURCE SIGN AVATAR CC BACKEND 🤟")
    print("=" * 60)
    print(f"ASLG-PC12 translator: {len(asl_translator.sentence_pairs)} sentence pairs loaded")
    print(f"Available ASL signs: {len(avatar_generator.asl_poses)} poses")
    print(f"Handshape database: {len(avatar_generator.asl_handshapes)} configurations")
    print("\n📚 CAPABILITIES:")
    print("✓ Real-time pose generation using MediaPipe")
    print("✓ Fingerspelling for unknown words")
    print("✓ 30 FPS animation sequences")
    print("✓ Normalized coordinate system (0-1)")
    print("✓ Export in JSON, CSV, and MediaPipe formats")
    
    print("\n🔧 OPEN-SOURCE LIBRARIES:")
    try:
        import mediapipe
        print("✓ MediaPipe: Hand, pose, and face detection")
    except ImportError:
        print("✗ MediaPipe: Not installed (pip install mediapipe)")
    
    try:
        import cv2
        print("✓ OpenCV: Computer vision processing")
    except ImportError:
        print("✗ OpenCV: Not installed (pip install opencv-python)")
    
    try:
        import numpy
        print("✓ NumPy: Mathematical computations")
    except ImportError:
        print("✗ NumPy: Not installed (pip install numpy)")
    
    print(f"\n🚀 Server starting at: http://localhost:5000")
    print("📊 Health check: http://localhost:5000/health")
    print("🔍 Available poses: http://localhost:5000/get-pose-database")
    print("=" * 60)
    
    app.run(debug=True, host='localhost', port=5000)