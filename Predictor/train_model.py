import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Masking

data_dir = 'sequence_data'
sequences = []
labels = []
label_to_index = {}
index_to_label = {}
label_counter = 0
max_sequence_length = 0

print("Loading sequence data...")

for file in os.listdir(data_dir):
    if file.endswith(".csv"):
        file_path = os.path.join(data_dir, file)
        df = pd.read_csv(file_path, header=None)
        
        label = file.split('_')[0]
        print(f"Processing file: {file}, Label: {label}")

        if label not in label_to_index:
            label_to_index[label] = label_counter
            index_to_label[label_counter] = label
            print(f"Added new label: {label} with index {label_counter}")
            label_counter += 1
        
        sequence = df.iloc[:,:-1].to_numpy()
        sequences.append(sequence)
        labels.append(label_to_index[label])

        if len(sequence) > max_sequence_length:
            max_sequence_length = len(sequence)

print(f"Found {len(sequences)} sequences with {label_counter} unique labels")
print(f"Labels: {index_to_label}")
print(f"Maximum sequence length: {max_sequence_length}")

padded_sequences = []
for seq in sequences:
    padding = np.zeros((max_sequence_length - len(seq), seq.shape[1]))
    padded_seq = np.vstack((seq,padding))
    padded_sequences.append(padded_seq)
X = np.array(padded_sequences)
y = tf.keras.utils.to_categorical(labels, num_classes = len(label_to_index))

print(f"Input shape: {X.shape}")
print(f"Output shape: {y.shape}")

model = Sequential([
    Masking(mask_value=0.0, input_shape=(max_sequence_length, X.shape[2])),
    LSTM(64),
    Dense(len(label_to_index), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

model.fit(X,y, epochs=50)

model.save('gesture_model.h5')

label_map = {}
for idx, label in index_to_label.items():
    label_map[idx] = label

print("Saving label map:")
print(label_map)
np.save('label_map.npy', label_map)

print("Model training complete and saved as 'gesture_model.h5'.")
print("Label map saved as 'label_map.npy'")