import * as net from "node:net";

const pipeName = '\\\\.\\pipe\\myNamedPipe';

// Named Pipe クライアントの作成
const client = net.createConnection(pipeName, () => {
  console.log('クライアントがサーバーに接続しました');

  // データの送信
  client.write('こんにちは、サーバー！');
});

// データの受信
client.on('data', (data: any) => {
  console.log(`クライアントがデータを受信: ${data}`);
  // サーバーとの通信を終了
  client.end();
});

// サーバーからの切断
client.on('end', () => {
  console.log('クライアントがサーバーから切断しました');
});

// エラー処理
client.on('error', (err: any) => {
  console.error('クライアントエラー:', err);
});
