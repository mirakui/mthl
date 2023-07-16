from lib.data_loader import DataLoader
from lib.predictor import Predictor
from progressbar import ProgressBar

from .constants import *


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
        self,
        model_path,
        data_path,
        strategy,
    ):
        self.model_path = model_path
        self.data_path = data_path
        self.strategy = strategy
        self.stats = Stats()
        self.test_data = None
        self.scaled_test_data = None
        self.results = {}

    def load(self):
        data_loader = DataLoader(self.data_path)
        df = data_loader.load()
        df, scaled_df = data_loader.preprocess(df)
        self.test_data = df
        self.scaled_test_data = scaled_df

    def run(self):
        predictor = Predictor(self.model_path)
        predictor.load_model()
        self.results = {}
        self.stats.clear()

        print("Running strategy tester...")
        with ProgressBar(max_value=self.test_data.shape[0]) as bar:
            for index, row in self.scaled_test_data.iterrows():
                date = self.test_data.iloc[index]["Date"]
                predictor.add(
                    date,
                    row["Open"],
                    row["High"],
                    row["Low"],
                    row["Close"],
                    row["Trend"],
                )
                if predictor.is_ready():
                    predictor_result = predictor.predict()
                    self.results[index] = {
                        "prediction": predictor_result.prediction,
                    }
                    trade = self.strategy.make_decision(predictor_result)
                    if trade is not None:
                        self.results[index]["trade"] = trade
                        self.stats.inc("trades")
                        self.stats.inc("trades_{}".format(trade["direction"]))

                if index > TRADE_DURATION:
                    past_index = index - TRADE_DURATION
                    if (
                        past_index in self.results
                        and "trade" in self.results[past_index]
                    ):
                        past_trade = self.results[past_index]["trade"]
                        winlose = self.evaluate_trade(row["Open"], past_trade)
                        self.results[index - TRADE_DURATION]["winlose"] = winlose
                        self.results[index - TRADE_DURATION]["result_price"] = row[
                            "Open"
                        ]
                        self.stats.inc(winlose)

                bar.update(index)

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

    def dump_results(self, path):
        print("Dumping results...")
        with open(path, "w") as f:
            f.write("Date,Open,High,Low,Close,Trend,Trade,WinLose\n")
            with ProgressBar(max_value=self.test_data.shape[0]) as bar:
                for index, row in self.test_data.iterrows():
                    prediction = direction = position = winlose = result_price = ""
                    if index in self.results:
                        prediction = self.results[index]["prediction"]
                        if "trade" in self.results[index]:
                            trade = self.results[index]["trade"]
                            direction = trade["direction"]
                            position = trade["position"]
                        if "winlose" in self.results[index]:
                            winlose = self.results[index]["winlose"]
                        if "result_price" in self.results[index]:
                            result_price = self.results[index]["result_price"]
                    line = "{},{},{},{},{},{},{},{},{},{},{}\n".format(
                        row["Date"],
                        row["Open"],
                        row["High"],
                        row["Low"],
                        row["Close"],
                        row["Trend"],
                        prediction,
                        direction,
                        position,
                        result_price,
                        winlose,
                    )
                    f.write(line)
                    bar.update(index)
