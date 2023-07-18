import numpy as np
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from lib.constants import *


class PredictorResult:
    def __init__(self, prediction, last_close_price):
        self.prediction = prediction
        self.last_close_price = last_close_price


class Predictor:
    def __init__(self, model_path):
        self.model_path = model_path
        self.buffer = np.empty((0, 6), dtype=object)
        self.model = None

    def load_model(self):
        print(f"Loading model from {self.model_path}")
        # .keras だと compile=True (デフォルト) でエラーになる。 .h5 だとならない
        compile = not self.model_path.endswith(".keras")
        self.model = tf.keras.saving.load_model(self.model_path, compile=compile)

    def add(self, datetime, open_price, high_price, low_price, close_price, trend):
        # バッファに同じ日時のロウソク足があるか確認
        if datetime in self.buffer[:, 0]:
            return

        # バッファに追加
        self.buffer = np.append(
            self.buffer,
            np.array(
                [[datetime, open_price, high_price, low_price, close_price, trend]]
            ),
            axis=0,
        )

        # バッファが60件以上ならば、最初の行を削除
        if len(self.buffer) > WINDOW_SIZE:
            self.buffer = np.delete(self.buffer, 0, 0)

        return self.buffer

    def predict(self):
        if not self.is_ready():
            return

        buffer_ohlo = self.buffer[:, 1:].astype(float)  # 日時を除いた価格データのみを渡す(OHLOのみ)
        scaler = MinMaxScaler()
        scaled_ohlo = scaler.fit_transform(buffer_ohlo)
        expanded_ohlo = np.expand_dims(scaled_ohlo, axis=0)

        # Predict the price movement
        # We are using sigmoid in the output layer, so the prediction will be a value between 0 and 1.
        # We will interpret this as a binary prediction, with values > 0.5 corresponding to 1 (UP) and otherwise 0 (DOWN)
        # return 'HIGH' if prediction > 0.5 else 'LOW'
        prediction = self.model.predict(expanded_ohlo, verbose=0)

        last_close_price = float(self.buffer[-1, 4])

        return PredictorResult(prediction[0][0], last_close_price)

    def is_ready(self):
        return len(self.buffer) >= WINDOW_SIZE
