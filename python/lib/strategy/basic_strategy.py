from .strategy import Strategy


class BasicStrategy(Strategy):
    def __init__(self, high_threshold=0.5, low_threshold=0.5, cooldown_duration=0):
        super().__init__()
        self.high_threshold = high_threshold
        self.low_threshold = low_threshold
        self.cooldown_duration = cooldown_duration
        self.cooldown_timer = cooldown_duration

    def make_decision(self, predictor_result):
        if self.cooldown_timer > 0:
            self.cooldown_timer -= 1
            return None

        trade = None
        # print(f"Prediction: {predictor_result.prediction}")
        if predictor_result.prediction >= self.high_threshold:
            self.cooldown_timer = self.cooldown_duration
            trade = {"direction": "high", "position": predictor_result.last_close_price}
        elif predictor_result.prediction <= self.low_threshold:
            self.cooldown_timer = self.cooldown_duration
            trade = {"direction": "low", "position": predictor_result.last_close_price}

        return trade
