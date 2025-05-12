import os
import numpy as np #Used for numerical operations llike padding sequences
import pandas as pd #Used to read CSV files into dataframes
import tensorflow as tf #Frameworks to build and train machine learning model
from tensorflow.keras.models import Sequential #Sequential model is a linear stack of layers
from tensorflow.keras.layers import LSTM, Dense, Masking 
#LSTM -> A type or recurrent neural network layer that can process sequences, has memory that remembers from earlier sequences
#Dense is a regular fully connected neuron network layer where every neuron is connected to every neuron in other layers
#Masking is a special layer used to handle padded seq, if they have diff length, pad them into the same length

data_dir = 'sequence_data'
sequences = [] #Store the gesture data sequences
labels = [] #Store gesture labels
label_to_index = {} #Dictionary mapping labels
index_to_label = {}
label_counter = 0 #Tracks how many unique labels present
max_sequence_length = 0 #Tracks the longest sequence for padding purposes

for file in os.listdir(data_dir):
    if file.endswith(".csv"):
        df = pd.read_csv(os.path.join(data_dir, file), header=None) #os.path.join ensures that path separator works for any OS, pandas by default treats 1st row as column names, hence need None
        label = df.iloc[0,1] #Uses integer location based indexing to extract a specific value, 0 means 1st row, -1 means last column

        if label not in label_to_index:
            label_to_index[label] = label_counter
            index_to_label[label_counter] = label
            label_counter +=1
        
        sequence = df.iloc[:,:-1].to_numpy #This will drop the label column and keep only numeric features, and convert them to numpy array
        sequences.append(sequence)
        labels.append(label_to_index[label])

        if len(sequence) > max_sequence_length:
            max_sequence_length = len(sequence)
#Neural networks require fixed-size inputs for processing, if we have 2 gestures with timestamp diff of 10, with 3 features each, 
#seq.shape[1] gives 3 therefore we are creating a 10x3 array of zeros
padded_sequences = []
for seq in sequences:
    padding = np.zeros((max_sequence_length - len(seq), seq.shape[1]))
    padded_seq = np.vstack((seq,padding)) #Will then vertically stack the original matrix with this padding matrix to make them uniform
    padded_sequences.append(padded_seq)
X = np.array(padded_sequences) #Converts this into a numpy array
#one-hot encoding converts category labels into numeric vectors for models to understand since using numnbers may make model think there is order
#to_categorical() converts lists into one-hot encoded vector. num_class tells TensorFlow how many distinct labels exist in dataset and how long one-hot vector should be
#Example of one-hot vector: [0,1]
y = tf.keras.utils.to_categorical(labels, num_class = len(label_to_index))

#Argument for Sequential are the layers of data
#Masking tells model to ignore padded parts of the sequence
#LSTM(64) adds a long short term memory layer with 64 hidden units to learn temporal patterns
#Dense(units, activation='softmax') outputs probabilities over the classes
model = Sequential([
    Masking(mask_value=0.0, input_shape=(max_sequence_length, X.shape[2])), #mask_value=0.0 ignores frames thatr are all 0s.X.shape[2] is the number of features per frame
    LSTM(64),
    Dense(len(label_to_index), activation='softmax')#1st para is the number of output classes, 2nd para converts raw scores to prob diist over class
])

#Configuring of model for training
'''
model.compile sets model to learn by 
1) Adjusting its weights(Optimiser)
2)What error to minimize(loss function)
3)What progress to report(metrics)

A neural network learns by adjusting weights based on how wrong its predictions are -> Optimiser determines how big/small adjustments are
#Adam means Adaptive Moment Estimation -> Adjusts the learning rate automatically

Loss function measures how far off the model's predictions are from the correct answers
Categorical cross-entropy compares outputted probabilities to the correct one-hot label

Metrics tells us how well the model is performing
metrics is telling TensorFlow to track and report how often the model gets the label correctly
'''
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

#An epoch is 1 full pass through all the training data
model.fit(X,y, epochs=50) #In essence going through datasets 50 times. Can also specify number of data processed at anytime with batch_size

model.save('gesture_model.h5')
np.save('label_map.npy', index_to_label)
print("Model training complete and saved as 'gesture_model.h5'.")





