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
extern string PipeName = "\\\\.\\pipe\\myNamedPipe";

datetime LastBarTime;
int LastPeriod;
int Pipe = INVALID_HANDLE;

int OnInit() {
  LastBarTime = iTime(NULL, 0, 0);
  LastPeriod = Period();

  OpenPipe();
  SendMessage("HELLO!!!");

  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
  ClosePipe();
}

void OnTick() {
  double signalValue;

  if (!IsNewTick()) { return; }

  signalValue = DetectSignal(IndicatorName, 0);
  if (signalValue != 0) {
    Alert("Signal detected at bar 0 with value ", signalValue);
  }
  signalValue = DetectSignal(IndicatorName, 1);
  if (signalValue != 0) {
    Alert("Signal detected at bar 1 with value ", signalValue);
  }

  int currentPeriod = Period();
  datetime currentBarTime = iTime(NULL, 0, 0);
  Print("currentBarTime = " + TimeToString(currentBarTime, TIME_DATE | TIME_SECONDS) + " | " + EnumToString((ENUM_TIMEFRAMES)currentPeriod));
}

bool IsNewTick() {
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

double DetectSignal(string indicatorName, int bufferIndex) {
  double v0 = iCustom(NULL, 0, indicatorName, bufferIndex, 2);
  double v1 = iCustom(NULL, 0, indicatorName, bufferIndex, 1);
  if (v0 == 0 && v1 != 0) {
    return v1;
  }
  else {
    return 0;
  }
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
  FileWriteString(Pipe, message + "\r\n");

  int lastError = GetLastError();
  if(lastError == ERR_NO_ERROR) {
    Print("[SUCCESS] SendMessage: " + message);
  }
  else {
    Print("[ERROR] SendMessage: " + message + " / Error: " + ErrorDescription(lastError));
  }

  return lastError;
}
