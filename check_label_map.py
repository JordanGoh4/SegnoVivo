import numpy as np
import os

# First check if the file exists
if not os.path.exists('label_map.npy'):
    print("ERROR: label_map.npy file does not exist in this directory.")
    print(f"Current working directory: {os.getcwd()}")
    print("Files in this directory:")
    for file in os.listdir():
        print(f"  - {file}")
    exit()

# If file exists, try to load it
try:
    # Load the label map
    label_map = np.load('label_map.npy', allow_pickle=True).item()
    
    # Print detailed information
    print("\n--- LABEL MAP DETAILS ---")
    print(f"Type: {type(label_map)}")
    print(f"Content: {label_map}")
    print("\nKeys and their types:")
    for key in label_map:
        print(f"Key: {key} (type: {type(key)}), Value: {label_map[key]} (type: {type(label_map[key])})")
    
    # Check if it's usable as a classification map
    valid_map = True
    for key, value in label_map.items():
        if not isinstance(key, (int, np.integer)) or isinstance(value, (float, np.floating)):
            valid_map = False
            print(f"\nProblem: Key {key} or value {value} has inappropriate type for a label map.")
    
    if valid_map:
        print("\nThe label map appears to be valid for classification.")
    else:
        print("\nThe label map is NOT valid for classification.")
    
except Exception as e:
    print(f"Error loading or processing label map: {e}")
    print("This suggests the file might be corrupted or in an unexpected format.")