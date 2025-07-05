import numpy as np
from typing import Dict, List
from pose_database import get_sign_data, get_available_signs

class OpenSourceAvatarGenerator:
    def __init__(self):
        self.pose_generators = {
            "wave": self.generate_wave_movement,
            "forward_from_chin": self.generate_forward_movement,
            "point_forward": self.generate_point_movement,
            "point_self": self.generate_point_self_movement,
            "circular": self.generate_circular_movement,
            "mouth_to_hand": self.generate_mouth_to_hand_movement,
            "static": self.generate_static_pose
        }
        print(f"Avatar generator ready. Signs loaded: {len(get_available_signs())}")

    async def generate_avatar_animation(self, asl_gloss: str, method: str = 'dataset') -> Dict:
        words = asl_gloss.split()
        animation_sequence = []
        total_frames = 0

        for word in words:
            word_upper = word.upper()
            sign_data = get_sign_data(word_upper)

            if sign_data and sign_data.get("dataset") == "asl_lex":
                word_animation = await self.generate_from_linguistic_properties(word, sign_data)
            else:
                word_animation = self.generate_fingerspelling_animation(word)

            animation_sequence.append(word_animation)
            total_frames += word_animation["frame_count"]

        return {
            "success": True,
            "data": {
                "asl_gloss": asl_gloss,
                "animation_sequence": animation_sequence,
                "total_frames": total_frames,
                "fps": 30,
                "duration": total_frames / 30,
                "type": "simplified_dataset_rendering"
            }
        }

    async def generate_from_linguistic_properties(self, word: str, sign_data: Dict) -> Dict:
        handshape_1 = sign_data.get("handshape_1", "")
        movement = sign_data.get("movement", "static")
        location = sign_data.get("location", "neutral")
        complexity = sign_data.get("complexity", 3)

        frame_count = max(18, int(complexity * 6))
        movement_type = self.map_movement_to_generator(movement)
        frames = self.pose_generators.get(movement_type, self.generate_static_pose)(frame_count, location)

        return {
            "word": word,
            "frame_count": frame_count,
            "frames": frames,
            "dataset": "asl_lex",
            "handshape": handshape_1,
            "movement": movement,
            "location": location
        }

    def generate_fingerspelling_animation(self, word: str) -> Dict:
        frames = []
        letters = list(word.upper())
        frames_per_letter = 20
        for i, letter in enumerate(letters):
            for frame in range(frames_per_letter):
                frames.append({
                    "frame_number": i * frames_per_letter + frame,
                    "letter": letter,
                    "hand_landmarks": [{"x": 0.6, "y": 0.5, "z": 0.0}],
                    "timestamp": (i * frames_per_letter + frame) / 30,
                    "handshape": f"letter_{letter.lower()}"
                })

        return {
            "word": word,
            "type": "fingerspelling",
            "frame_count": len(frames),
            "frames": frames
        }

    def map_movement_to_generator(self, movement: str) -> str:
        m = movement.lower()
        if "wave" in m: return "wave"
        if "forward" in m: return "forward_from_chin"
        if "point" in m: return "point_forward"
        if "circle" in m: return "circular"
        if "mouth" in m: return "mouth_to_hand"
        return "static"

    def get_location_coordinates(self, location: str) -> tuple:
        return {
            "neutral": (0.5, 0.5),
            "chest": (0.5, 0.6),
            "chin": (0.5, 0.4),
            "mouth": (0.5, 0.35),
            "forehead": (0.5, 0.25)
        }.get(location, (0.5, 0.5))

    def generate_static_pose(self, frame_count: int, location: str = "neutral") -> List[Dict]:
        x, y = self.get_location_coordinates(location)
        return [{"frame_number": i, "hand_landmarks": [{"x": x, "y": y, "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_wave_movement(self, frame_count: int, location: str) -> List[Dict]:
        x, y = self.get_location_coordinates(location)
        return [{"frame_number": i, "hand_landmarks": [{"x": x + 0.05 * np.sin(i * 0.4), "y": y, "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_forward_movement(self, frame_count: int, location: str) -> List[Dict]:
        x0, y0 = self.get_location_coordinates(location)
        return [{"frame_number": i, "hand_landmarks": [{"x": x0 + 0.15 * (i / (frame_count - 1)), "y": y0 + 0.1 * (i / (frame_count - 1)), "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_point_movement(self, frame_count: int, location: str) -> List[Dict]:
        x, y = self.get_location_coordinates(location)
        return [{"frame_number": i, "hand_landmarks": [{"x": x + (0.02 * np.sin(i * 0.8)), "y": y, "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_point_self_movement(self, frame_count: int, location: str = "chest") -> List[Dict]:
        return [{"frame_number": i, "hand_landmarks": [{"x": 0.5, "y": 0.7, "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_circular_movement(self, frame_count: int, location: str) -> List[Dict]:
        x, y = self.get_location_coordinates(location)
        radius = 0.04
        return [{"frame_number": i, "hand_landmarks": [{"x": x + radius * np.cos((i / frame_count) * 2 * np.pi), "y": y + radius * np.sin((i / frame_count) * 2 * np.pi), "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]

    def generate_mouth_to_hand_movement(self, frame_count: int, location: str) -> List[Dict]:
        x0, y0 = 0.5, 0.35
        x1, y1 = 0.4, 0.6
        return [{"frame_number": i, "hand_landmarks": [{"x": x0 + (x1 - x0) * (i / (frame_count - 1)), "y": y0 + (y1 - y0) * (i / (frame_count - 1)), "z": 0.0}], "timestamp": i / 30} for i in range(frame_count)]