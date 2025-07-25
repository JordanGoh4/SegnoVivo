import os
import csv
import json


def flat63_to_xy21(flat):
    return [[flat[i], flat[i + 1]] for i in range(0, 63, 3)]


data_dir = "Predictor/sequence_data"
input_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]
output_json_path = os.path.join(data_dir, "pose_database_normalized.json")

pose_db = {}

for fname in input_files:
    label = fname.split("_")[0].upper()
    frames = []
    with open(os.path.join(data_dir, fname)) as f:
        reader = csv.reader(f)
        for row in reader:
            floats = [float(x) for x in row if x.strip()]
            if len(floats) < 63:
                continue
            frames.append({"right_hand": flat63_to_xy21(floats[:63])})

    if frames:
        pose_db.setdefault(label, []).extend(frames)


with open(output_json_path, "w") as f:
    json.dump(pose_db, f, indent=2)

print(f"Finished writing converted pose database copy to {output_json_path}")
