import json
import os
import pandas as pd
from typing import Dict, List, Optional

class ASLDatasetLoader:
    def __init__(self):
        self.data_dir = "data"
        self.ensure_data_directory()

        self.datasets = {
            "wlasl": {
                "name": "WLASL (Word-Level ASL)",
                "file": "wlasl_annotations.json",
                "format": "json"
            },
            "asl_lex": {
                "name": "ASL-LEX",
                "file": "asl_lex.csv",
                "format": "csv"
            }
        }

        self.loaded_datasets = {}
        self.pose_data = {}
        self.load_all()

    def ensure_data_directory(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def load_all(self):
        for dataset_id, dataset in self.datasets.items():
            path = os.path.join(self.data_dir, dataset['file'])
            if not os.path.exists(path):
                print(f"Missing: {path}")
                continue
            if dataset['format'] == "csv":
                self.load_csv_dataset(dataset_id, path)
            else:
                self.load_json_dataset(dataset_id, path)

    def load_csv_dataset(self, dataset_id, path):
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            gloss = row.get("Sign", "").upper()
            if gloss:
                self.pose_data[gloss] = {
                    "word": gloss,
                    "frequency": row.get("Frequency", 0),
                    "iconicity": row.get("Iconicity", 0),
                    "complexity": row.get("Complexity", 0),
                    "handshape_1": row.get("Handshape_1", ""),
                    "handshape_2": row.get("Handshape_2", ""),
                    "location": row.get("Location", ""),
                    "movement": row.get("Movement", ""),
                    "dataset": dataset_id
                }
        self.loaded_datasets[dataset_id] = True

    def load_json_dataset(self, dataset_id, path):
        with open(path, 'r') as f:
            data = json.load(f)
        for entry in data:
            gloss = entry.get("gloss", "").upper()
            if gloss:
                self.pose_data[gloss] = {
                    "word": gloss,
                    "instances": entry.get("instances", []),
                    "dataset": dataset_id
                }
        self.loaded_datasets[dataset_id] = True

    def get_sign_data(self, word):
        return self.pose_data.get(word.upper())

    def get_available_signs(self):
        return list(self.pose_data.keys())

loader = ASLDatasetLoader()
get_sign_data = loader.get_sign_data
get_available_signs = loader.get_available_signs