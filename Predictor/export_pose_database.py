import os
import json
import csv

sequence_data_dir = os.path.join(os.path.dirname(__file__), "sequence_data")
output_path = os.path.join(sequence_data_dir, "pose_database.json")

pose_database = {}
max_points_by_gloss = {}

print(f"\n🔍 Scanning CSV files in: {sequence_data_dir}\n{'-'*60}")

for file_name in sorted(os.listdir(sequence_data_dir)):
    if not file_name.endswith(".csv"):
        continue

    file_path = os.path.join(sequence_data_dir, file_name)

    # Extract gloss (e.g., Love_346.csv → Love)
    gloss = file_name.split("_")[0].upper()

    try:
        with open(file_path, newline='') as csvfile:
            reader = csv.reader(csvfile)
            points = []
            for row in reader:
                if len(row) >= 2:
                    try:
                        x, y = float(row[0]), float(row[1])
                        points.append([x, y])
                    except:
                        print(f"    ⚠️ Invalid float in {file_name}: {row}")

            num_points = len(points)
            if num_points >= 21:
                if gloss not in pose_database or num_points > max_points_by_gloss[gloss]:
                    pose_database[gloss] = [{"right_hand": points}]
                    max_points_by_gloss[gloss] = num_points
                    print(f"✅ Selected {file_name} → {gloss} ({num_points} points)")
                else:
                    print(f"ℹ️ Skipped {file_name} (only {num_points} points; {max_points_by_gloss[gloss]} is higher)")
            else:
                print(f"⚠️ Skipped {file_name} — only {num_points} points (< 21)")

    except Exception as e:
        print(f"❌ Failed to read {file_name}: {e}")

# Save output
with open(output_path, "w") as f:
    json.dump(pose_database, f, indent=2)

print(f"\n✅ Saved {len(pose_database)} glosses to {output_path}")