//+------------------------------------------------------------------+
//|                                                         Mthl.mq4 |
//|                                                          mirakui |
//|                                  https://github.com/mirakui/mhtl |
//+------------------------------------------------------------------+

#include <stderror.mqh>
#include <stdlib.mqh>

#property copyright "mirakui"
#property link      "https://github.com/mirakui/mhtl"
#property version   "1.00"
#property strict

extern string IndicatorName = "TESTarrow";
extern string PipeName = "\\\\.\\pipe\\mthl";
extern int BufferHigh = 0;
extern int BufferLow = 1;
extern bool Aggressive = false;

datetime LastSignalBarTime;
int LastSignalPeriod;
int Pipe = INVALID_HANDLE;

int OnInit() {
  LastSignalBarTime = iTime(NULL, 0, 0);
  LastSignalPeriod = Period();
  Print("Started: Symbol=" + Symbol() + ", IndicatorName=" + IndicatorName + ", PipeName=" + PipeName + ", Aggressive=" + BoolToString(Aggressive));

  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
}

void OnTick() {
  double signalValue;

  if (!IsNewTick()) { return; }

  signalValue = DetectSignal(IndicatorName, BufferHigh);
  if (signalValue != 0) {
    Print("Signal detected at buffer " + IntegerToString(BufferHigh) + " (BufferHigh) with value ", signalValue);
    SendEntry("high", signalValue, IndicatorName);
  }
  signalValue = DetectSignal(IndicatorName, BufferLow);
  if (signalValue != 0) {
    Print("Signal detected at buffer " + IntegerToString(BufferLow) + " (BufferLow) with value ", signalValue);
    SendEntry("low", signalValue, IndicatorName);
  }
}

void SendEntry(string order, double expectedPrice, string indicatorName) {
  int currentPeriod = Period();
  datetime currentBarTime = iTime(NULL, 0, 0);
  Print("[SendEntry] Symbol=" + Symbol() + ", IndicatorName=" + IndicatorName + ", currentBarTime = " + TimeToString(currentBarTime, TIME_DATE | TIME_SECONDS) + " | " + EnumToString((ENUM_TIMEFRAMES)currentPeriod));
  SendMessage("{ \"command\": \"Entry\", \"order\": \"" + order + "\", \"pairName\": \"" + Symbol() + "\", \"expectedPrice\": " + DoubleToString(expectedPrice) + ", \"comment\": \"" + IndicatorName + "\" }");
}

bool IsNewTick() {
  datetime barTime = iTime(NULL, 0, 0);
  int period = Period();
  if (barTime != LastSignalBarTime && period == LastSignalPeriod) {
    return true;
  }
  else {
    return false;
  }
}

double DetectSignal(string indicatorName, int bufferIndex) {
  datetime barTime = iTime(NULL, 0, 0);
  int period = Period();

  if (Aggressive) {
    double v = iCustom(NULL, 0, indicatorName, bufferIndex, 0);
    if (v > 0) {
      LastSignalBarTime = barTime;
      LastSignalPeriod = period;
      return v;
    }
  }
  else {
    double v0 = iCustom(NULL, 0, indicatorName, bufferIndex, 2);
    double v1 = iCustom(NULL, 0, indicatorName, bufferIndex, 1);
    if (v0 == 0 && v1 != 0) {
      LastSignalBarTime = barTime;
      LastSignalPeriod = period;
      return v1;
    }
  }

  return 0;
}

int OpenPipe() {
  Pipe = FileOpen(PipeName, FILE_WRITE | FILE_BIN | FILE_ANSI);

  if (Pipe >= 0) {
    Print("[SUCCESS] OpenPipe: " + PipeName);
  }
  else {
    int lastError = GetLastError();
    Print("[ERROR] OpenPipe: " + PipeName + " / Error: " + ErrorDescription(lastError));
  }

  return Pipe;
}

void ClosePipe() {
  if (Pipe >= 0) {
    Print("ClosePipe: " + PipeName);
    FileClose(Pipe);
  }
}

int SendMessage(string message) {
  OpenPipe();
  FileWriteString(Pipe, message + "\r\n");

  int lastError = GetLastError();
  if(lastError == ERR_NO_ERROR) {
    Print("[SUCCESS] SendMessage: " + message);
  }
  else {
    Print("[ERROR] SendMessage: " + message + " / Error: " + ErrorDescription(lastError));
  }
  ClosePipe();

  return lastError;
}
