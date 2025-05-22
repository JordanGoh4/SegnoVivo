from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  # Add this import
import os
import whisper
import yt_dlp
from datasets import load_dataset
import nltk
from nltk.tokenize import sent_tokenize
import uuid  # Add this import for generating unique IDs
import json  # Add this import

# Download NLTK resources if not already downloaded
nltk.download('punkt', quiet=True)

class ASLGPC12Translator:
    def __init__(self):
        #we will have to load the dataset
        try:
            print("Loading ASLG-PC12 dataset...")
            self.dataset = load_dataset('aslg_pc12')
            self.build_translation_dict()
            print(f"ASLG-PC12 translator initialized with {len(self.sentence_pairs)} sentence pairs")
        except Exception as e:
            print(f"Error loading dataset: {e}")
            self.sentence_pairs = []
            self.word_pairs = {}
            self.phrase_pairs = {}
    
    def build_translation_dict(self):
        #This extracts sentence pairs
        self.sentence_pairs = []
        self.word_pairs = {}
        self.phrase_pairs = {}

        #Loop iterates through all training examples where each item is a dictionary
        for item in self.dataset['train']:
            eng_text = item['text'].strip().lower()
            asl_gloss = item['gloss'].strip()
            self.sentence_pairs.append((eng_text, asl_gloss))
            eng_words = eng_text.split()
            asl_words = asl_gloss.split()

            if len(eng_words) == len(asl_words):
                for i in range(len(eng_words)):
                    eng_word = eng_words[i].lower()
                    asl_word = asl_words[i]
                    
                    #Only adds if ASL word isn't empty
                    if asl_word:
                        self.word_pairs[eng_word] = asl_word
            
            #Extract 2 and 3-word phrases 
            for n in range(2, 4):
                for i in range(len(eng_words) - n + 1):
                    if i + n <= len(asl_words):
                        # Use spaces between words for proper phrase formation
                        eng_phrase = " ".join(eng_words[i:i+n]).lower()
                        asl_phrase = " ".join(asl_words[i:i+n])

                        if len(eng_phrase) > 5 and asl_phrase:
                            self.phrase_pairs[eng_phrase] = asl_phrase
    
    def translate_sentence(self, text):
        #If we are unable to get an exact match, tokenise sentence and initialize a result list and pointer
        lower_text = text.lower().strip()
        
        # Check for exact sentence match
        for eng, asl in self.sentence_pairs:
            if eng == lower_text:
                return asl
        
        words = nltk.word_tokenize(lower_text)
        result_words = []
        i = 0

        #We will do phrase matching from longest to shortest
        while i < len(words):
            # Try to match 3-word phrases
            if i + 2 < len(words):
                # Use proper list construction with spaces
                phrases_3 = " ".join([words[i], words[i+1], words[i+2]]).lower()
                if phrases_3 in self.phrase_pairs:
                    result_words.append(self.phrase_pairs[phrases_3])
                    i += 3
                    continue
            
            # Try to match 2-word phrases
            if i + 1 < len(words):
                phrases_2 = " ".join([words[i], words[i+1]]).lower()
                if phrases_2 in self.phrase_pairs:
                    result_words.append(self.phrase_pairs[phrases_2])
                    i += 2
                    continue
            
            word = words[i].lower()
            # Properly check for alphanumeric or apostrophe
            word = "".join(c for c in word if c.isalnum() or c == "'")

            if not word:
                i += 1
                continue

            if word in self.word_pairs:
                result_words.append(self.word_pairs[word])
            else:
                if word in ['a', 'an', 'the', 'of', 'to']:
                    pass  # Skip articles and common prepositions
                else:
                    result_words.append(word.upper())
            i += 1
        
        # Join with spaces between words for proper ASL gloss format
        return " ".join(result_words)

# Initialize the translator globally
asl_translator = ASLGPC12Translator()

app = Flask(__name__) #A new Flask web application instance, __name__ is a special Python variable representing name of current module
CORS(app)  # Enable CORS for all routes - this is crucial for your Chrome extension

# Create directories for storing files
os.makedirs('static/animations', exist_ok=True)

model = whisper.load_model('base') #due to limited computer mem, we will use the smallest model

@app.route('/static/animations/<path:filename>')
def serve_animation(filename):
    """Serve animation files to the frontend"""
    return send_from_directory('static/animations', filename)

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
    
    try:
        with yt_dlp.YoutubeDL(ydl_opt) as ydl:
            ydl.download([url])
        
        result = model.transcribe(filename)
        transcript = result['text']
        
        # Get segments with timestamps if available
        segments = result.get('segments', [])
        
        # Process each segment or split transcript if no segments
        asl_segments = []
        if segments:
            # Process each segment with timestamps
            for segment in segments:
                text = segment['text']
                start = segment['start']
                end = segment['end']
                
                # Translate to ASL gloss
                asl_gloss = asl_translator.translate_sentence(text)
                
                asl_segments.append({
                    "start": start,
                    "end": end,
                    "english": text,
                    "asl_gloss": asl_gloss
                })
        else:
            # If no segments, split by sentences
            sentences = sent_tokenize(transcript)
            for sentence in sentences:
                # Translate to ASL gloss
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
        # Clean up file if an error occurs
        if os.path.exists(filename):
            os.remove(filename)
        return jsonify({'error': str(e)}), 500

@app.route('/generate-avatar', methods=['POST'])
def generate_avatar():
    """Generate avatar animation for ASL gloss (placeholder implementation)"""
    try:
        data = request.get_json()
        asl_gloss = data.get('asl_gloss')
        
        if not asl_gloss:
            return jsonify({"error": "ASL gloss is required"}), 400
        
        print(f"Generating avatar for ASL gloss: {asl_gloss}")
        
        # Generate a unique filename
        animation_id = str(uuid.uuid4())
        animation_path = f"static/animations/{animation_id}.json"
        
        # TODO: Replace this section with actual SignMoz integration
        # For now, we'll create a placeholder response
        placeholder_data = {
            "asl_gloss": asl_gloss,
            "animation_type": "placeholder",
            "message": "Avatar generation placeholder - SignMoz integration coming soon!",
            "created_at": str(uuid.uuid4())
        }
        
        # Save placeholder data
        with open(animation_path, 'w') as f:
            json.dump(placeholder_data, f, indent=2)
        
        print(f"Avatar placeholder created: {animation_path}")
        
        return jsonify({
            "success": True,
            "animation_url": f"/static/animations/{animation_id}.json",
            "message": "Avatar generation successful (placeholder mode)",
            "asl_gloss": asl_gloss
        })
    
    except Exception as e:
        print(f"Error in generate_avatar: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the server is running"""
    return jsonify({
        "status": "healthy", 
        "message": "Sign Avatar CC Backend is running!",
        "translator_loaded": len(asl_translator.sentence_pairs) > 0
    })

if __name__ == '__main__':
    print("Starting Sign Avatar CC Backend...")
    print(f"ASLG-PC12 translator status: {len(asl_translator.sentence_pairs)} sentence pairs loaded")
    print("Server will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    app.run(debug=True, host='localhost', port=5000)