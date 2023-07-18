import socket
import sys
from keras.models import load_model
import numpy as np
from sklearn.preprocessing import MinMaxScaler

BUFFER_SIZE = 60
# PIPE_PATH = '\\\\.\\pipe\\candlecat'
PIPE_PATH = "/tmp/candlecat"


class Server:
    def __init__(self):
        pass

    def start(self):
        pass


class Predictor:
    def __init__(self, model_path):
        self.model_path = model_path
        self.buffer = np.empty((0, 5), dtype=object)

    def setup(self):
        print(f"Loading model from {self.model_path}")
        self.model = load_model(self.model_path)

    def add(self, datetime, open_price, high_price, low_price, close_price):
        # バッファに同じ日時のロウソク足があるか確認
        if datetime in self.buffer[:, 0]:
            return

        # バッファに追加
        self.buffer = np.append(
            self.buffer,
            np.array([[datetime, open_price, high_price, low_price, close_price]]),
            axis=0,
        )

        # バッファが60件以上ならば、最初の行を削除
        if len(self.buffer) > BUFFER_SIZE:
            self.buffer = np.delete(self.buffer, 0, 0)

        return self.buffer

    def predict(self):
        if not self.is_ready():
            return

        input_data = self.buffer[:, 1:].astype(float)  # 日時を除いた価格データのみを渡す
        prediction = self.make_prediction(self.model, input_data)
        last_close_price = self.buffer[-1, 4]
        highlow = "HIGH" if prediction > 0.5 else "LOW"
        print(
            f"PREDICTION: {highlow} ({prediction}) (last close price: {last_close_price})"
        )

    def is_ready(self):
        return len(self.buffer) >= BUFFER_SIZE

    def make_prediction(self, input_data):
        scaler = MinMaxScaler()
        input_data = scaler.fit_transform(input_data).copy()
        # Assume that input_data is a numpy array of shape (60, 4)
        # and has the same preprocessing as the training data
        input_data = np.expand_dims(input_data, axis=0)

        # Predict the price movement
        # We are using sigmoid in the output layer, so the prediction will be a value between 0 and 1.
        # We will interpret this as a binary prediction, with values > 0.5 corresponding to 1 (UP) and otherwise 0 (DOWN)
        # return 'HIGH' if prediction > 0.5 else 'LOW'
        return self.model.predict(input_data)


def sock_readlines(sock, recv_buffer=4096, delim="\n"):
    buffer = ""
    data = True
    while data:
        data = sock.recv(recv_buffer)
        buffer += data.decode()

        while buffer.find(delim) != -1:
            line, buffer = buffer.split("\n", 1)
            yield line
    return


def main():
    if len(sys.argv) < 2:
        print("Please specify the path to the model")
        sys.exit(1)
    model_path = sys.argv[1]
    predictor = Predictor(model_path)
    predictor.setup()

    print(f"Opening pipe: {PIPE_PATH}")
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.bind(PIPE_PATH)
    sock.listen(1)

    while True:
        print("waiting for a connection")
        connection, client_address = sock.accept()

        try:
            print("connection from", client_address)

            for line in sock_readlines(connection):
                print("received {!r}".format(line))
                datetime, open_price, high_price, low_price, close_price = line.split(
                    ","
                )
                predictor.add(datetime, open_price, high_price, low_price, close_price)
                if predictor.is_ready():
                    predictor.predict()

        finally:
            connection.close()


if __name__ == "__main__":
    main()
