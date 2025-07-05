import json
import os
import requests
import pandas as pd
from typing import Dict, List, Optional, Tuple
import numpy as np

class ASLDatasetLoader:
    """
    Loads ASL poses from real research datasets instead of hardcoded data
    """
    
    def __init__(self):
        self.data_dir = "data"
        self.ensure_data_directory()
        
        self.datasets = {
            "wlasl": {
                "name": "WLASL (Word-Level ASL)",
                "url": "https://dxli94.github.io/WLASL/",
                "description": "Large-scale dataset with 2000+ ASL signs",
                "format": "video_with_annotations",
                "file": "wlasl_annotations.json"
            },
            "asl_lex": {
                "name": "ASL-LEX", 
                "url": "https://asl-lex.org/",
                "description": "Psycholinguistic database of ASL signs",
                "format": "csv_with_properties",
                "file": "asl_lex.csv"
            },
        }
        
        self.loaded_datasets = {}
        self.pose_data = {}
        self.handshape_data = {}
        
        self.load_all_available_datasets()
    
    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            print(f"Created data directory: {self.data_dir}")
    
    def load_all_available_datasets(self):
        """Load all available datasets from files or download if needed"""
        print("Loading ASL datasets...")
        
        for dataset_id, dataset_info in self.datasets.items():
            file_path = os.path.join(self.data_dir, dataset_info["file"])
            
            if os.path.exists(file_path):
                self.load_dataset_file(dataset_id, file_path)
            else:
                print(f"Dataset {dataset_info['name']} not found at {file_path}")
                self.create_download_instructions(dataset_id, dataset_info)
        
        if not self.loaded_datasets:
            print("No datasets found. Loading basic fallback signs...")
            self.load_basic_fallback()
    
    def load_dataset_file(self, dataset_id: str, file_path: str):
        """Load a specific dataset file"""
        try:
            dataset_info = self.datasets[dataset_id]
            
            if dataset_info["format"] == "csv_with_properties":
                self.load_csv_dataset(dataset_id, file_path)
            elif dataset_info["format"] in ["video_with_annotations", "video_annotations", "pose_coordinates", "pose_sequences"]:
                self.load_json_dataset(dataset_id, file_path)
            
            print(f"✓ Loaded {dataset_info['name']}")
            
        except Exception as e:
            print(f"✗ Error loading {dataset_id}: {e}")
    
    def load_csv_dataset(self, dataset_id: str, file_path: str):
        """Load CSV format dataset (like ASL-LEX)"""
        try:
            df = pd.read_csv(file_path)
            
            if dataset_id == "asl_lex":
                pose_data = {}
                for _, row in df.iterrows():
                    sign = row.get('Sign', '').upper()
                    if sign:
                        pose_data[sign] = {
                            "word": sign,
                            "frequency": row.get('Frequency', 0),
                            "iconicity": row.get('Iconicity', 0), 
                            "complexity": row.get('Complexity', 0),
                            "sign_type": row.get('Sign_Type', 'unknown'),
                            "handshape_1": row.get('Handshape_1', ''),
                            "handshape_2": row.get('Handshape_2', ''),
                            "location": row.get('Location', ''),
                            "movement": row.get('Movement', ''),
                            "dataset": "asl_lex"
                        }
                
                self.loaded_datasets[dataset_id] = pose_data
                self.pose_data.update(pose_data)
                
        except Exception as e:
            print(f"Error loading CSV dataset {dataset_id}: {e}")
    
    def load_json_dataset(self, dataset_id: str, file_path: str):
        """Load JSON format dataset"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            if dataset_id == "wlasl":
                self.process_wlasl_data(data)
            elif dataset_id == "ms_asl":
                self.process_ms_asl_data(data)
            elif dataset_id == "asllvd":
                self.process_asllvd_data(data)
            elif dataset_id == "how2sign":
                self.process_how2sign_data(data)
            
            self.loaded_datasets[dataset_id] = data
            
        except Exception as e:
            print(f"Error loading JSON dataset {dataset_id}: {e}")
    
    def process_wlasl_data(self, data: Dict):
        """Process WLASL dataset format"""
        for item in data:
            gloss = item.get('gloss', '').upper()
            if gloss:
                pose_info = {
                    "word": gloss,
                    "instances": item.get('instances', []),
                    "video_count": len(item.get('instances', [])),
                    "dataset": "wlasl"
                }
                
                if 'keypoints' in item:
                    pose_info["keypoints"] = item['keypoints']
                    pose_info["frame_count"] = len(item['keypoints'])
                
                self.pose_data[gloss] = pose_info
    
    def process_ms_asl_data(self, data: Dict):
        """Process MS-ASL dataset format"""
        for item in data:
            if 'text' in item and 'pose_data' in item:
                words = item['text'].upper().split()
                for word in words:
                    if word not in self.pose_data:
                        self.pose_data[word] = {
                            "word": word,
                            "pose_sequence": item['pose_data'],
                            "dataset": "ms_asl"
                        }
    
    def process_asllvd_data(self, data: Dict):
        """Process ASLLVD dataset format (already has pose coordinates)"""
        for sign_id, sign_data in data.items():
            gloss = sign_data.get('gloss', '').upper()
            if gloss:
                self.pose_data[gloss] = {
                    "word": gloss,
                    "pose_coordinates": sign_data.get('coordinates', []),
                    "handshape": sign_data.get('handshape', ''),
                    "movement": sign_data.get('movement', ''),
                    "location": sign_data.get('location', ''),
                    "dataset": "asllvd"
                }
    
    def process_how2sign_data(self, data: Dict):
        """Process How2Sign dataset format"""
        for item in data:
            if 'gloss' in item and 'pose_keypoints' in item:
                gloss = item['gloss'].upper()
                self.pose_data[gloss] = {
                    "word": gloss,
                    "pose_keypoints": item['pose_keypoints'],
                    "frame_count": len(item['pose_keypoints']),
                    "dataset": "how2sign"
                }
    
    def create_download_instructions(self, dataset_id: str, dataset_info: Dict):
        """Create instructions for downloading datasets"""
        instructions_file = os.path.join(self.data_dir, f"{dataset_id}_instructions.txt")
        
        instructions = f"""
Dataset: {dataset_info['name']}
Description: {dataset_info['description']}
URL: {dataset_info['url']}
Expected file: {dataset_info['file']}

Download Instructions:
1. Visit {dataset_info['url']}
2. Follow the dataset download instructions
3. Place the data file as: {os.path.join(self.data_dir, dataset_info['file'])}
4. Restart the application

File Format: {dataset_info['format']}
"""
        
        with open(instructions_file, 'w') as f:
            f.write(instructions)
        
        print(f"Created download instructions: {instructions_file}")
    
    def load_basic_fallback(self):
        """Load basic fallback signs when no datasets are available"""
        fallback_signs = {
            "HELLO": {
                "word": "HELLO",
                "handshape": "flat_hand",
                "movement": "wave",
                "location": "near_head",
                "frames": 30,
                "dataset": "fallback"
            },
            "THANK-YOU": {
                "word": "THANK-YOU", 
                "handshape": "flat_hand",
                "movement": "forward_from_chin", 
                "location": "chin_to_forward",
                "frames": 24,
                "dataset": "fallback"
            },
            "YOU": {
                "word": "YOU",
                "handshape": "index_point",
                "movement": "point_forward",
                "location": "neutral_space",
                "frames": 18,
                "dataset": "fallback"
            },
            "ME": {
                "word": "ME",
                "handshape": "index_point", 
                "movement": "point_self",
                "location": "chest",
                "frames": 18,
                "dataset": "fallback"
            },
            "PLEASE": {
                "word": "PLEASE",
                "handshape": "flat_hand",
                "movement": "circular",
                "location": "chest", 
                "frames": 36,
                "dataset": "fallback"
            },
            "GOOD": {
                "word": "GOOD",
                "handshape": "flat_hand",
                "movement": "mouth_to_hand",
                "location": "mouth_to_other_hand",
                "frames": 30,
                "dataset": "fallback"
            }
        }
        
        self.pose_data.update(fallback_signs)
        self.loaded_datasets["fallback"] = fallback_signs
        print(f"Loaded {len(fallback_signs)} fallback signs")
    
    def get_sign_data(self, word: str) -> Optional[Dict]:
        """Get pose data for a specific sign"""
        return self.pose_data.get(word.upper())
    
    def get_available_signs(self) -> List[str]:
        """Get list of all available signs"""
        return list(self.pose_data.keys())
    
    def get_dataset_stats(self) -> Dict:
        """Get statistics about loaded datasets"""
        stats = {
            "total_signs": len(self.pose_data),
            "loaded_datasets": list(self.loaded_datasets.keys()),
            "datasets_info": {}
        }
        
        for dataset_name in self.loaded_datasets.keys():
            count = len([sign for sign in self.pose_data.values() if sign.get("dataset") == dataset_name])
            stats["datasets_info"][dataset_name] = {
                "sign_count": count,
                "description": self.datasets.get(dataset_name, {}).get("description", "")
            }
        
        return stats
    
    def search_signs(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for signs matching a query"""
        query = query.upper()
        matches = []
        
        for word, data in self.pose_data.items():
            if query in word:
                matches.append(data)
                if len(matches) >= limit:
                    break
        
        return matches
    
    def get_signs_by_dataset(self, dataset_name: str) -> List[Dict]:
        """Get all signs from a specific dataset"""
        return [sign for sign in self.pose_data.values() if sign.get("dataset") == dataset_name]
    
    def export_pose_data(self, filename: str = None) -> Dict:
        """Export all loaded pose data"""
        if filename:
            output_file = os.path.join(self.data_dir, filename)
            with open(output_file, 'w') as f:
                json.dump(self.pose_data, f, indent=2)
            print(f"Pose data exported to: {output_file}")
        
        return self.pose_data

dataset_loader = ASLDatasetLoader()

ASL_POSES = dataset_loader.pose_data
ASL_HANDSHAPES = {
    "flat_hand": {"description": "Flat palm, all fingers extended"},
    "index_point": {"description": "Index finger pointing, others closed"},
    "fist": {"description": "All fingers closed into fist"},
    "c_shape": {"description": "Hand curved like letter C"},
    "okay_sign": {"description": "Thumb and index finger forming circle"},
    "thumbs_up": {"description": "Thumb extended upward"}
}

def get_sign_data(word: str) -> Optional[Dict]:
    """Get pose data for a specific word"""
    return dataset_loader.get_sign_data(word)

def get_available_signs() -> List[str]:
    """Get list of all available signs"""
    return dataset_loader.get_available_signs()

def get_dataset_info() -> Dict:
    """Get information about loaded datasets"""
    return dataset_loader.get_dataset_stats()

def search_signs(query: str, limit: int = 10) -> List[Dict]:
    """Search for signs matching a query"""
    return dataset_loader.search_signs(query, limit)

if __name__ == "__main__":
    print("=" * 60)
    print("ASL DATASET LOADER RESULTS")
    print("=" * 60)
    
    stats = get_dataset_info()
    print(f"Total signs loaded: {stats['total_signs']}")
    print(f"Datasets loaded: {', '.join(stats['loaded_datasets'])}")
    
    print("\nDataset breakdown:")
    for dataset, info in stats['datasets_info'].items():
        print(f"- {dataset}: {info['sign_count']} signs")
        print(f"  {info['description']}")
    
    print(f"\nFirst 10 available signs:")
    signs = get_available_signs()[:10]
    for sign in signs:
        data = get_sign_data(sign)
        print(f"- {sign} (from {data.get('dataset', 'unknown')})")
    
    print("\n" + "=" * 60)
    print("To add more signs:")
    print("1. Download datasets from the URLs in data/ directory")
    print("2. Place files as instructed in *_instructions.txt files")
    print("3. Restart the application")
    print("=" * 60)