import os
import json
import numpy as np

POSE_DATABASE_PATH = os.path.join("data", "pose_database.json")

class OpenSourceAvatarGenerator:
    def __init__(self):
        if os.path.exists(POSE_DATABASE_PATH):
            with open(POSE_DATABASE_PATH, "r") as f:
                self.pose_db = json.load(f)
        else:
            print("❌ pose_database.json not found.")
            self.pose_db = {}

    async def generate_avatar_animation(self, asl_gloss):
        frames = []
        gloss_tokens = asl_gloss.lower().split()

        for token in gloss_tokens:
            if token in self.pose_db:
                frames.extend(self.pose_db[token])
            else:
                print(f"⚠️ Token not in pose database: {token}")

        if frames:
            return {
                "success": True,
                "data": frames,
                "count": len(frames)
            }
        else:
            return {
                "success": False,
                "error": "No frames generated.",
                "data": []
            }

    def available_signs(self):
        return list(self.pose_db.keys())