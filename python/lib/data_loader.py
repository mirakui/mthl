import pandas as pd
import re


class DataLoader:
    def __init__(self, data_path):
        self.data_path = data_path

    def load(self):
        parser = ParserFactory(self.data_path).create()
        return parser.parse()


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
