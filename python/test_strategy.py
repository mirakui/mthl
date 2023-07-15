import sys
from lib.strategy_tester import StrategyTester
from lib.strategy.basic_strategy import BasicStrategy


if len(sys.argv) < 3:
    print("Usage: python test_strategy.py <model_path> <data_path>")
    sys.exit(1)

model_path = sys.argv[1]
data_path = sys.argv[2]

strategy = BasicStrategy()
tester = StrategyTester(model_path, data_path, strategy, 60, 5)

tester.load()
stats = tester.run()

print(stats.stats)
