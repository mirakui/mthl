import sys
from lib.strategy_tester import StrategyTester
from lib.strategy.basic_strategy import BasicStrategy


if len(sys.argv) < 3:
    print("Usage: python test_strategy.py <model_path> <data_path>")
    sys.exit(1)

model_path = sys.argv[1]
data_path = sys.argv[2]

strategy = BasicStrategy()
tester = StrategyTester(model_path, data_path, strategy)

tester.load()
stats = tester.run()

print(stats.stats)
win_rate = stats.get("win") / (stats.get("win") + stats.get("lose"))
print("Win rate: %.2f%%" % (win_rate * 100))

tester.dump_results("results.csv")
