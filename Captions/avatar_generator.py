import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Optional
import json
from pose_database import ASL_POSES, ASL_HANDSHAPES

class OpenSourceAvatarGenerator:
    """Open-source avatar generation using MediaPipe, OpenPose, and free libraries"""
    
    def __init__(self):
        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.mp_pose = mp.solutions.pose
        self.mp_face = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Initialize pose estimators
        self.hands_detector = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        self.pose_detector = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.face_detector = self.mp_face.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Load ASL pose database from external file
        self.asl_poses = ASL_POSES
        self.asl_handshapes = ASL_HANDSHAPES
    
    async def generate_avatar_animation(self, asl_gloss: str, method: str = 'mediapipe') -> Dict:
        """Generate avatar animation using open-source libraries"""
        try:
            words = asl_gloss.split()
            animation_sequence = []
            total_frames = 0
            
            for word in words:
                word_upper = word.upper()
                
                if word_upper in self.asl_poses:
                    # Generate pose sequence for known sign
                    pose_data = self.asl_poses[word_upper]
                    word_animation = self.generate_word_animation(word, pose_data)
                    animation_sequence.append(word_animation)
                    total_frames += word_animation["frame_count"]
                else:
                    # Generate fingerspelling animation for unknown words
                    fingerspell_animation = self.generate_fingerspelling_animation(word)
                    animation_sequence.append(fingerspell_animation)
                    total_frames += fingerspell_animation["frame_count"]
            
            # Create complete animation data
            avatar_data = {
                "type": "mediapipe_poses",
                "asl_gloss": asl_gloss,
                "animation_sequence": animation_sequence,
                "total_frames": total_frames,
                "fps": 30,
                "duration": total_frames / 30,
                "format": "mediapipe_landmarks",
                "coordinate_system": "normalized_0_to_1",
                "libraries_used": ["mediapipe", "opencv", "numpy"]
            }
            
            return {
                "success": True,
                "data": avatar_data,
                "method": "open_source_mediapipe"
            }
            
        except Exception as e:
            print(f"Error generating open-source avatar: {e}")
            return await self._generate_error_response(asl_gloss)
    
    def generate_word_animation(self, word: str, pose_data: Dict) -> Dict:
        """Generate animation frames for a single word"""
        frames = []
        frame_count = pose_data["dominant_hand"]["frames"]
        
        # Generate keyframes based on movement type
        movement = pose_data["dominant_hand"]["movement"]
        landmarks = pose_data["dominant_hand"]["landmarks"]
        
        if movement == "wave":
            frames = self.generate_wave_movement(landmarks, frame_count)
        elif movement == "forward_from_chin":
            frames = self.generate_forward_movement(landmarks, frame_count)
        elif movement == "point":
            frames = self.generate_point_movement(landmarks, frame_count)
        elif movement == "circular_on_chest":
            frames = self.generate_circular_movement(landmarks, frame_count)
        elif movement == "mouth_to_hand":
            frames = self.generate_mouth_to_hand_movement(landmarks, frame_count)
        else:
            frames = self.generate_static_pose(landmarks, frame_count)
        
        return {
            "word": word,
            "frame_count": frame_count,
            "frames": frames,
            "pose_info": pose_data["pose"],
            "face_info": pose_data["face"],
            "handshape": self.get_handshape_for_word(word)
        }
    
    def generate_fingerspelling_animation(self, word: str) -> Dict:
        """Generate fingerspelling animation for unknown words"""
        frames = []
        letters = list(word.upper())
        frames_per_letter = 20  # Slightly faster fingerspelling
        
        for i, letter in enumerate(letters):
            letter_frames = self.generate_letter_frames(letter, frames_per_letter)
            frames.extend(letter_frames)
        
        return {
            "word": word,
            "type": "fingerspelling",
            "frame_count": len(frames),
            "frames": frames,
            "letters": letters,
            "handshape": "alphabet_sequence"
        }
    
    def generate_wave_movement(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate wave movement frames"""
        frames = []
        base_x = landmarks[0]["x"]
        base_y = landmarks[0]["y"]
        
        for frame in range(frame_count):
            # Create wave motion
            wave_offset = 0.05 * np.sin(frame * 0.4)
            
            frame_landmarks = []
            for landmark in landmarks:
                frame_landmarks.append({
                    "x": landmark["x"] + wave_offset,
                    "y": landmark["y"],
                    "z": landmark["z"],
                    "visibility": 0.9
                })
            
            frames.append({
                "frame_number": frame,
                "hand_landmarks": frame_landmarks,
                "timestamp": frame / 30.0
            })
        
        return frames
    
    def generate_forward_movement(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate forward movement from chin"""
        frames = []
        start_pos = landmarks[0]
        end_pos = landmarks[1] if len(landmarks) > 1 else {"x": start_pos["x"] + 0.1, "y": start_pos["y"] + 0.1, "z": 0.0}
        
        for frame in range(frame_count):
            progress = frame / (frame_count - 1)
            
            # Interpolate between start and end positions
            current_x = start_pos["x"] + (end_pos["x"] - start_pos["x"]) * progress
            current_y = start_pos["y"] + (end_pos["y"] - start_pos["y"]) * progress
            
            frames.append({
                "frame_number": frame,
                "hand_landmarks": [{
                    "x": current_x,
                    "y": current_y,
                    "z": 0.0,
                    "visibility": 0.9
                }],
                "timestamp": frame / 30.0
            })
        
        return frames
    
    def generate_point_movement(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate pointing movement"""
        frames = []
        point_pos = landmarks[0]
        
        for frame in range(frame_count):
            # Slight emphasis movement
            emphasis = 0.02 * np.sin(frame * 0.8) if frame < frame_count // 2 else 0
            
            frames.append({
                "frame_number": frame,
                "hand_landmarks": [{
                    "x": point_pos["x"] + emphasis,
                    "y": point_pos["y"],
                    "z": point_pos["z"],
                    "visibility": 0.9
                }],
                "timestamp": frame / 30.0,
                "handshape": "index_point"
            })
        
        return frames
    
    def generate_circular_movement(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate circular movement on chest"""
        frames = []
        center = landmarks[0]
        radius = 0.03
        
        for frame in range(frame_count):
            angle = (frame / frame_count) * 2 * np.pi
            
            frames.append({
                "frame_number": frame,
                "hand_landmarks": [{
                    "x": center["x"] + radius * np.cos(angle),
                    "y": center["y"] + radius * np.sin(angle),
                    "z": center["z"],
                    "visibility": 0.9
                }],
                "timestamp": frame / 30.0,
                "handshape": "flat_hand"
            })
        
        return frames
    
    def generate_mouth_to_hand_movement(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate movement from mouth to other hand"""
        frames = []
        start_pos = landmarks[0]  # Mouth position
        end_pos = landmarks[1]    # Hand position
        
        for frame in range(frame_count):
            progress = frame / (frame_count - 1)
            
            current_x = start_pos["x"] + (end_pos["x"] - start_pos["x"]) * progress
            current_y = start_pos["y"] + (end_pos["y"] - start_pos["y"]) * progress
            
            frames.append({
                "frame_number": frame,
                "hand_landmarks": [{
                    "x": current_x,
                    "y": current_y,
                    "z": 0.0,
                    "visibility": 0.9
                }],
                "timestamp": frame / 30.0,
                "handshape": "flat_hand"
            })
        
        return frames
    
    def generate_static_pose(self, landmarks: List[Dict], frame_count: int) -> List[Dict]:
        """Generate static pose frames"""
        frames = []
        
        for frame in range(frame_count):
            frames.append({
                "frame_number": frame,
                "hand_landmarks": landmarks,
                "timestamp": frame / 30.0
            })
        
        return frames
    
    def generate_letter_frames(self, letter: str, frame_count: int) -> List[Dict]:
        """Generate frames for fingerspelling a single letter"""
        # Basic ASL alphabet positions (simplified)
        alphabet_poses = {
            'A': {"x": 0.5, "y": 0.5, "handshape": "fist"},
            'B': {"x": 0.5, "y": 0.5, "handshape": "flat_hand"},
            'C': {"x": 0.5, "y": 0.5, "handshape": "c_shape"},
            'D': {"x": 0.5, "y": 0.5, "handshape": "d_shape"},
            'E': {"x": 0.5, "y": 0.5, "handshape": "e_shape"},
            'F': {"x": 0.5, "y": 0.5, "handshape": "f_shape"},
            'G': {"x": 0.5, "y": 0.5, "handshape": "g_shape"},
            'H': {"x": 0.5, "y": 0.5, "handshape": "h_shape"},
            'I': {"x": 0.5, "y": 0.5, "handshape": "i_shape"},
            'J': {"x": 0.5, "y": 0.5, "handshape": "j_shape"},
            'K': {"x": 0.5, "y": 0.5, "handshape": "k_shape"},
            'L': {"x": 0.5, "y": 0.5, "handshape": "l_shape"},
            'M': {"x": 0.5, "y": 0.5, "handshape": "m_shape"},
            'N': {"x": 0.5, "y": 0.5, "handshape": "n_shape"},
            'O': {"x": 0.5, "y": 0.5, "handshape": "o_shape"},
            'P': {"x": 0.5, "y": 0.5, "handshape": "p_shape"},
            'Q': {"x": 0.5, "y": 0.5, "handshape": "q_shape"},
            'R': {"x": 0.5, "y": 0.5, "handshape": "r_shape"},
            'S': {"x": 0.5, "y": 0.5, "handshape": "s_shape"},
            'T': {"x": 0.5, "y": 0.5, "handshape": "t_shape"},
            'U': {"x": 0.5, "y": 0.5, "handshape": "u_shape"},
            'V': {"x": 0.5, "y": 0.5, "handshape": "v_shape"},
            'W': {"x": 0.5, "y": 0.5, "handshape": "w_shape"},
            'X': {"x": 0.5, "y": 0.5, "handshape": "x_shape"},
            'Y': {"x": 0.5, "y": 0.5, "handshape": "y_shape"},
            'Z': {"x": 0.5, "y": 0.5, "handshape": "z_shape"}
        }
        
        pose = alphabet_poses.get(letter, {"x": 0.5, "y": 0.5, "handshape": "flat_hand"})
        frames = []
        
        for frame in range(frame_count):
            frames.append({
                "frame_number": frame,
                "letter": letter,
                "hand_landmarks": [{
                    "x": pose["x"],
                    "y": pose["y"],
                    "z": 0.0,
                    "visibility": 0.9
                }],
                "timestamp": frame / 30.0,
                "handshape": pose["handshape"]
            })
        
        return frames
    
    def get_handshape_for_word(self, word: str) -> str:
        """Get appropriate handshape for a word"""
        handshape_mapping = {
            "HELLO": "flat_hand",
            "THANK-YOU": "flat_hand", 
            "YOU": "index_point",
            "ME": "index_point",
            "PLEASE": "flat_hand",
            "GOOD": "flat_hand",
            "BAD": "flat_hand",
            "YES": "fist",
            "NO": "index_point"
        }
        
        return handshape_mapping.get(word.upper(), "flat_hand")
    
    async def _generate_error_response(self, asl_gloss: str) -> Dict:
        """Generate error response with basic pose data"""
        return {
            "success": False,
            "data": {
                "type": "error",
                "asl_gloss": asl_gloss,
                "message": "Could not generate avatar - using fallback",
                "fallback_animation": {
                    "type": "basic_pose",
                    "frames": 30,
                    "basic_landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0}]
                }
            },
            "method": "error_fallback"
        }