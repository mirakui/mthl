import sys
from datetime import datetime

import numpy as np
import tensorflow as tf
from lib.data_loader import DataLoader
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from lib.constants import *

EPOCHS = 10

# Load dataset
if len(sys.argv) < 2:
    print("Please specify the path to the dataset")
    sys.exit(1)
data_path = sys.argv[1]
print(f"Loading dataset from {data_path}")

data_loader = DataLoader(data_path)
df = data_loader.load()

print("Preparing dataset...")
df, scaled_df = data_loader.preprocess(df)

# Prepare dataset for model training
x, y = [], []
for i in range(WINDOW_SIZE, len(scaled_df) - TRADE_DURATION):
    x.append(scaled_df[i - WINDOW_SIZE : i])
    y.append(1 if df["Close"].iloc[i] < df["Open"].iloc[i + TRADE_DURATION] else 0)
x = np.array(x)
y = np.array(y)

# Split the dataset into training and test sets
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, shuffle=False)

# Build LSTM model
model = tf.keras.models.Sequential()
model.add(
    tf.keras.layers.LSTM(
        units=50, return_sequences=True, input_shape=(x_train.shape[1], 5)
    )
)
model.add(tf.keras.layers.Dropout(0.2))
model.add(tf.keras.layers.LSTM(units=50))
model.add(tf.keras.layers.Dropout(0.2))
model.add(tf.keras.layers.Dense(units=1, activation="sigmoid"))

print("Training model...")

# Compile and train the model
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
model.fit(x_train, y_train, epochs=EPOCHS, batch_size=32)

print("Evaluating model...")
# Make predictions
y_pred = model.predict(x_test)
y_pred = np.where(y_pred > 0.5, 1, 0)

# Evaluate the model
print("Accuracy: ", accuracy_score(y_test, y_pred))

# Save the model
now = datetime.now().strftime("%Y%m%d%H%M")
model_name = f"mthl-{now}.keras"
print(f"Saving model as {model_name}")
tf.keras.saving.save_model(model, model_name, save_format="keras")

# Load the model
print(f"Loading model: {model_name}")
# .keras だと compile=True (デフォルト) でエラーになる。 .h5 だとならない
loaded_model = tf.keras.saving.load_model(model_name, compile=False)
print(f"Successfully loaded model: {model_name}")
y_pred2 = loaded_model.predict(x_test)
y_pred2 = np.where(y_pred2 > 0.5, 1, 0)

# Evaluate the model
print("Accuracy of loaded model: ", accuracy_score(y_test, y_pred2))
print(f"Finished")
