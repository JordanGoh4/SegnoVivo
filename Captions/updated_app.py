from flask import Flask, request, jsonify
from flask_cors import CORS
from avatar_generator import OpenSourceAvatarGenerator

app = Flask(__name__)
CORS(app)

generator = OpenSourceAvatarGenerator()

@app.route("/generate-avatar", methods=["POST"])
def generate_avatar():
    data = request.get_json()
    gloss = data.get("gloss", "")
    frames = generator.generate(gloss)
    return jsonify({
        "frames": frames,
        "fps": generator.fps
    })

if __name__ == "__main__":
    app.run(debug=True)