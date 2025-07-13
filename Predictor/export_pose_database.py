import os
import csv
import json

# Set up paths
sequence_data_dir = os.path.join(os.path.dirname(__file__), "sequence_data")
output_path = os.path.join(sequence_data_dir, "pose_database.json")

# For logging
print(f"🔍 Scanning CSV files in: {sequence_data_dir}")
print("-" * 60)

# Gloss map (optional – use if you want to remap folder/file names to friendly glosses)
gloss_map = {
    "0_369": "0", "1_381": "1", "2_393": "2", "3_406": "3", "4_420": "4", "5_432": "5",
    "A_10": "A", "B_14": "B", "Bye_293": "Bye", "C_19": "C", "D_25": "D", "Deaf_360": "Deaf",
    "E_30": "E", "F_35": "F", "G_69": "G", "H_77": "H", "Hello_0": "Hello", "I_87": "I",
    "J_97": "J", "K_108": "K", "L_118": "L", "Love_346": "Love", "M_128": "M", "N_139": "N",
    "No_318": "No", "O_150": "O", "P_161": "P", "Q_173": "Q", "R_184": "R", "S_196": "S",
    "T_208": "T", "Thanks_5": "Thanks", "U_220": "U", "V_232": "V", "W_244": "W", "X_256": "X",
    "Y_270": "Y", "Yes_307": "Yes", "You_332": "You", "Z_282": "Z"
}

# Helper to extract gloss name
def get_gloss_from_filename(filename):
    base = os.path.splitext(filename)[0]
    return gloss_map.get(base, base.split("_")[0])

# Dictionary to store the best file per gloss
best_samples = {}

# Read all CSV files and select best sample for each gloss
for file_name in os.listdir(sequence_data_dir):
    if not file_name.endswith(".csv"):
        continue

    file_path = os.path.join(sequence_data_dir, file_name)
    gloss = get_gloss_from_filename(file_name)

    with open(file_path, "r") as f:
        reader = csv.reader(f)
        try:
            keypoints = [[float(x), float(y)] for x, y in reader if len(x.strip()) > 0 and len(y.strip()) > 0]
        except Exception as e:
            print(f"❌ Error reading {file_name}: {e}")
            continue

    num_points = len(keypoints)

    if num_points < 21:
        print(f"⚠️ Skipped {file_name} — only {num_points} points")
        continue

    if gloss not in best_samples or num_points > len(best_samples[gloss]):
        best_samples[gloss] = keypoints
        print(f"✅ {file_name} → {gloss} ({num_points} points)")

# Format into output database
pose_database = {
    gloss.upper(): [{"right_hand": keypoints}]
    for gloss, keypoints in best_samples.items()
}

# Save to JSON
with open(output_path, "w") as f:
    json.dump(pose_database, f, indent=2)

print("\n💾 Saving JSON...")
print(f"✅ Done. Saved {len(pose_database)} glosses to {output_path}")