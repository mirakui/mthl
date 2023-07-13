from keras.models import load_model
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np

# Load the model
model = load_model('fx_prediction_model.h5')

def make_prediction(input_data):
    # Assume that input_data is a numpy array of shape (60, 4)
    # and has the same preprocessing as the training data
    input_data = np.expand_dims(input_data, axis=0)

    # Predict the price movement
    # We are using sigmoid in the output layer, so the prediction will be a value between 0 and 1.
    # We will interpret this as a binary prediction, with values > 0.5 corresponding to 1 (UP) and otherwise 0 (DOWN)
    # return 'HIGH' if prediction > 0.5 else 'LOW'
    return model.predict(input_data)

def process_prediction(prediction, last_close_price):
    highlow = 'HIGH' if prediction > 0.5 else 'LOW'
    print(f'PREDICTION: {highlow} ({prediction}) (latest close price: {last_close_price})')

def main():
    # データのバッファ（最大60件）
    buffer = np.empty((0, 5), dtype=object)

    while True:
        line = input()
        datetime, open_price, high_price, low_price, close_price = line.split(';')

        # バッファに同じ日時のロウソク足があるか確認
        if datetime in buffer[:, 0]:
            continue

        # バッファに追加
        buffer = np.append(buffer, np.array([[datetime, open_price, high_price, low_price, close_price]]), axis=0)

        # バッファが60件以上ならば、最初の行を削除
        if len(buffer) > 60:
            buffer = np.delete(buffer, 0, 0)

        # バッファが60件貯まったら、predict関数を呼び出す
        if len(buffer) == 60:
            input_data = buffer[:, 1:].astype(float) # 日時を除いた価格データのみを渡す
            prediction = make_prediction(input_data)
            process_prediction(prediction, close_price)

if __name__ == '__main__':
    main()
