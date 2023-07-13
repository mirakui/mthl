from datetime import datetime
import sys
import pandas as pd
import numpy as np
from keras.models import Sequential
from keras.layers import Dense, Dropout, LSTM
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BUFFER_SIZE = 60

# Load dataset
if len(sys.argv) < 2:
    print('Please specify the path to the dataset')
    sys.exit(1)
data_path = sys.argv[1]
print(f'Loading dataset from {data_path}')
df = pd.read_csv(data_path, sep=';', header=None)
df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']

print('Calculating trends...')

# Calculate the trend of last BUFFER_SIZE minutes and add it to the dataset
trends = []
for i in range(len(df)):
    if i < BUFFER_SIZE:
        trends.append(0)
    else:
        highs = np.sum(df['High'].iloc[i-BUFFER_SIZE:i] > df['Open'].iloc[i-BUFFER_SIZE:i])
        lows = np.sum(df['Low'].iloc[i-BUFFER_SIZE:i] < df['Open'].iloc[i-BUFFER_SIZE:i])
        if highs > lows:
            trends.append(1)
        else:
            trends.append(0)
df['Trend'] = trends

print('Preparing dataset...')

# Prepare dataset for model training
scaler = MinMaxScaler()
scaled_df = scaler.fit_transform(df[['Open', 'High', 'Low', 'Close', 'Volume', 'Trend']])
X, y = [], []
for i in range(BUFFER_SIZE, len(scaled_df)):
    X.append(scaled_df[i-BUFFER_SIZE:i])
    y.append(1 if df['Open'].iloc[i] > df['Close'].iloc[i-1] else 0)
X = np.array(X)
y = np.array(y)

# Split the dataset into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

# Build LSTM model
model = Sequential()
model.add(LSTM(units=50, return_sequences=True, input_shape=(X_train.shape[1], 6)))
model.add(Dropout(0.2))
model.add(LSTM(units=50))
model.add(Dropout(0.2))
model.add(Dense(units=1, activation='sigmoid'))

print('Training model...')

# Compile and train the model
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, batch_size=32)

print('Evaluating model...')
# Make predictions
y_pred = model.predict(X_test)
y_pred = np.where(y_pred > 0.5, 1, 0)

# Evaluate the model
print('Accuracy: ', accuracy_score(y_test, y_pred))

# Save the model
now = datetime.now().strftime("%Y%m%d%H%M")
model_name = f'mthl-{now}.keras'
print(f'Saving model as {model_name}')
model.save(model_name)
