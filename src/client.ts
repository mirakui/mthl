import * as net from "node:net";

const pipeName = '\\\\.\\pipe\\mthl';

// Named Pipe クライアントの作成
// const client = net.createConnection(pipeName, () => {
//   console.log('クライアントがサーバーに接続しました');
// });

// データの受信
// client.on('data', (data: any) => {
//   console.log(`クライアントがデータを受信: ${data}`);
//   // サーバーとの通信を終了
//   client.end();
// });

// サーバーからの切断
// client.on('end', () => {
//   console.log('クライアントがサーバーから切断しました');
// });

// エラー処理
// client.on('error', (err: any) => {
//   console.error('クライアントエラー:', err);
// });

process.stdin.resume();
process.stdin.setEncoding('utf8');
let input_string = '';

process.stdin.on('data', function (chunk) {
  input_string += chunk;
});

process.stdin.on('end', function () {
  const lines = input_string;
  const client = net.createConnection(pipeName, () => {
    client.write(lines);
    console.log(`sending: ${lines}`);
    process.exit(0);
  });
});
