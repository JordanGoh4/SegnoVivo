import os
import json

class OpenSourceAvatarGenerator:
    def __init__(self, fps: int = 24):
        self.fps = fps
        self.pose_db = {}
        self.load_pose_database()

    def load_pose_database(self):
        # Load from Predictor/sequence_data relative to this file
        root_dir = os.path.dirname(os.path.dirname(__file__))  # SegnoVivo
        pose_db_path = os.path.join(root_dir, "Predictor", "sequence_data", "pose_database.json")

        try:
            with open(pose_db_path, "r") as file:
                self.pose_db = json.load(file)
                print(f"✅ Loaded pose database with {len(self.pose_db)} entries.")
        except FileNotFoundError:
            print(f"❌ pose_database.json not found at {pose_db_path}")

    def generate(self, gloss: str):
        frames = []
        gloss_tokens = gloss.strip().upper().split()

        for token in gloss_tokens:
            if token in self.pose_db:
                frames.extend(self.pose_db[token])
            else:
                # Fingerspelling fallback
                for char in token:
                    if char in self.pose_db:
                        frames.extend(self.pose_db[char])

        return frames