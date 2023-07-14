//+------------------------------------------------------------------+
//|                                                    CandleCat.mq4 |
//|                                                          mirakui |
//|                                  https://github.com/mirakui/mhtl |
//+------------------------------------------------------------------+

#include <stderror.mqh>
#include <stdlib.mqh>

#property copyright "mirakui"
#property link      "https://github.com/mirakui/mhtl"
#property version   "1.00"
#property strict

extern string PipeName = "\\\\.\\pipe\\candlecat";
extern int PreloadBars = 60;

datetime LastBarTime;
int LastPeriod;
int Pipe = INVALID_HANDLE;

int OnInit() {
  LastBarTime = iTime(NULL, 0, 0);
  LastPeriod = Period();
  SendBars(PreloadBars);

  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
}

void OnTick() {
  if (!IsNewTick()) { return; }

  SendBars(1);
}

void SendBars(int barCount) {
  for (int i = 0; i < barCount; i++) {
    string barString = GetBarString(barCount - i);
    int error = SendMessage(barString);
    if (error != ERR_NO_ERROR) {
      break;
    }
  }
}

string GetBarString(int barIndex) {
  datetime barTime = iTime(NULL, PERIOD_CURRENT, barIndex);
  double openPrice = iOpen(Symbol(), PERIOD_CURRENT, barIndex);
  double closePrice = iClose(Symbol(), PERIOD_CURRENT, barIndex);
  double highPrice = iHigh(Symbol(), PERIOD_CURRENT, barIndex);
  double lowPrice = iLow(Symbol(), PERIOD_CURRENT, barIndex);
  return StringFormat("%s;%.3f;%.3f;%.3f;%.3f", TimeToString(barTime, TIME_DATE | TIME_SECONDS), openPrice, closePrice, highPrice, lowPrice);
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
