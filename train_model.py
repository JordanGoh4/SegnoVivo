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
        df.iloc[0,1] #Uses integer location based indexing to extract a specific value, 0 means 1st row, -1 means last column

        if label not in label_to_index:
            label_to_index[label] = 

