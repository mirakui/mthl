import re

import numpy as np
import pandas as pd

from .constants import *


class DataLoader:
    def __init__(self, data_path):
        self.data_path = data_path

    def load(self):
        parser = ParserFactory(self.data_path).create()
        return parser.parse()

    def preprocess(self, df):
        # Calculate the trend of last WINDOW_SIZE minutes and add it to the dataset
        trends = []
        for i in range(len(df)):
            if i < WINDOW_SIZE:
                trends.append(0)
            else:
                highs = np.sum(
                    df["High"].iloc[i - WINDOW_SIZE : i]
                    > df["Open"].iloc[i - WINDOW_SIZE : i]
                )
                lows = np.sum(
                    df["Low"].iloc[i - WINDOW_SIZE : i]
                    < df["Open"].iloc[i - WINDOW_SIZE : i]
                )
                if highs > lows:
                    trends.append(1)
                else:
                    trends.append(0)
        df["Trend"] = trends

        scaled_df = df[["Open", "High", "Low", "Close", "Trend"]].copy()
        scaled_df[["Open", "High", "Low", "Close"]] = (
            df[["Open", "High", "Low", "Close"]] - PRICE_MIN
        ) / (PRICE_MAX - PRICE_MIN)

        return (df, scaled_df)


class ParserFactory:
    def __init__(self, data_path):
        self.data_path = data_path

    def create(self):
        line = ""
        with open(self.data_path, "r") as f:
            line = f.readline()
        if Semicolon1Parser.guess(line):
            return Semicolon1Parser(self.data_path)
        elif Csv1Parser.guess(line):
            return Csv1Parser(self.data_path)
        else:
            raise Exception("Unknown data format: {!r}".format(line))


class Parser:
    def __init__(self, data_path):
        self.data_path = data_path

    def guess(line):
        raise Exception("Not implemented")

    def parse(self):
        raise Exception("Not implemented")


# 20220102 170000;115.039000;115.040000;115.039000;115.040000;0
class Semicolon1Parser(Parser):
    def __init__(self, data_path):
        super().__init__(data_path)

    def guess(line):
        if re.match(r"^\d{8} \d{6};(\d+\.\d+;){4}\d+$", line):
            return True
        else:
            return False

    def parse(self):
        df = pd.read_csv(self.data_path, sep=";", header=None)
        df.columns = ["Date", "Open", "High", "Low", "Close", "Volume"]
        return df


# 2023.05.01,00:06,136.112,136.116,136.112,136.116,3
class Csv1Parser(Parser):
    def __init__(self, data_path):
        super().__init__(data_path)

    def guess(line):
        if re.match(r"^\d{4}\.\d{2}\.\d{2},\d{2}:\d{2},(\d+\.\d+,){4}\d+$", line):
            return True
        else:
            return False

    def parse(self):
        df = pd.read_csv(self.data_path, sep=",", header=None)
        df.columns = ["Date", "Time", "Open", "High", "Low", "Close", "Volume"]
        df["Date"] = df["Date"].str.replace(".", "")
        df["Time"] = df["Time"].str.replace(":", "")
        df["Date"] = df["Date"] + " " + df["Time"]
        df = df.drop("Time", axis=1)
        return df
