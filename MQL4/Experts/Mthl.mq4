//+------------------------------------------------------------------+
//|                                                         Mthl.mq4 |
//|                                                          mirakui |
//|                                  https://github.com/mirakui/mhtl |
//+------------------------------------------------------------------+

#property copyright "mirakui"
#property link      "https://github.com/mirakui/mhtl"
#property version   "1.00"
#property strict

extern string IndicatorName = "TESTarrow";

datetime LastBarTime;
int LastPeriod;

int OnInit() {
  LastBarTime = iTime(NULL, 0, 0);
  LastPeriod = Period();
  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
}

void OnTick() {
  double signalValue;

  if (!isNewTick()) { return; }

  signalValue = detectSignal(IndicatorName, 0);
  if (signalValue != 0) {
    Alert("Signal detected at bar 0 with value ", signalValue);
  }
  signalValue = detectSignal(IndicatorName, 1);
  if (signalValue != 0) {
    Alert("Signal detected at bar 1 with value ", signalValue);
  }

  int currentPeriod = Period();
  datetime currentBarTime = iTime(NULL, 0, 0);
  Print("currentBarTime = " + TimeToString(currentBarTime, TIME_DATE | TIME_SECONDS) + " | " + EnumToString((ENUM_TIMEFRAMES)currentPeriod));
}

bool isNewTick() {
  datetime barTime = iTime(NULL, 0, 0);
  int period = Period();
  if (barTime != LastBarTime && period == LastPeriod) {
    LastBarTime = barTime;
    LastPeriod = period;
    return true;
  }
  else {
    return false;
  }
}

double detectSignal(string indicatorName, int bufferIndex) {
  double v0 = iCustom(NULL, 0, indicatorName, bufferIndex, 2);
  double v1 = iCustom(NULL, 0, indicatorName, bufferIndex, 1);
  if (v0 == 0 && v1 != 0) {
    return v1;
  }
  else {
    return 0;
  }
}
