from lib.predictor import Predictor
from lib.data_loader import DataLoader


class Stats:
    def __init__(self):
        self.stats = {}

    def inc(self, key):
        if key not in self.stats:
            self.stats[key] = 0
        self.stats[key] += 1

    def set(self, key, value):
        self.stats[key] = value

    def get(self, key):
        return self.stats[key]

    def stats(self):
        return self.stats

    def clear(self):
        self.stats = {}


class StrategyTester:
    def __init__(
        self, model_path, data_path, strategy, window_size=60, trade_duration=5
    ):
        self.model_path = model_path
        self.data_path = data_path
        self.strategy = strategy
        self.window_size = window_size
        self.trade_duration = trade_duration
        self.stats = Stats()
        self.test_data = None

    def load(self):
        data_loader = DataLoader(self.data_path)
        self.test_data = data_loader.load_and_preprocess()

    def run(self):
        predictor = Predictor(self.model_path, self.window_size)
        predictor.load_model()
        results = {}
        self.stats.clear()

        for index, row in self.test_data.iterrows():
            predictor.add(
                row["Date"],
                row["Open"],
                row["High"],
                row["Low"],
                row["Close"],
                row["Trend"],
            )
            if predictor.is_ready():
                predictor_result = predictor.predict()
                trade = self.strategy.make_decision(predictor_result)
                if trade is not None:
                    results[index] = {"trade": trade}
                    self.stats.inc("trades")
                    self.stats.inc("trades_{}".format(trade["direction"]))

            if index > self.trade_duration:
                past_index = index - self.trade_duration
                if past_index in results and "trade" in results[past_index]:
                    past_trade = results[past_index]["trade"]
                    winlose = self.evaluate_trade(row["Open"], past_trade)
                    results[index - self.trade_duration]["winlose"] = winlose
                    self.stats.inc(winlose)

        return self.stats

    def evaluate_trade(self, current_price, trade):
        position = trade["position"]
        direction = trade["direction"]

        if direction == "high":
            return "win" if current_price > position else "lose"
        elif direction == "low":
            return "win" if current_price < position else "lose"
        else:
            raise Exception("Unknown direction: {!r}".format(direction))
