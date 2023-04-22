import * as net from "node:net";
const pipeName = "\\\\.\\pipe\\myNamedPipe";

// Named Pipe サーバーの作成
const server = net.createServer(undefined, (socket: net.Socket) => {
  console.log("クライアントが接続しました");

  // データの受信
  socket.on("data", (data: any) => {
    console.log(`サーバーがデータを受信: ${data}`);
  });

  // クライアントからの切断
  socket.on("end", () => {
    console.log("クライアントが切断しました");
  });
});

// エラー処理
server.on("error", (err: any) => {
  console.error("サーバーエラー:", err);
});

// Named Pipe にバインド
server.listen(pipeName, () => {
  console.log(`サーバーが ${pipeName} でリッスンしています`);
});
