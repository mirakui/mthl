const { SocketModeClient } = require('@slack/socket-mode');
import { Config } from "./lib/config";

const config = Config.load();

import { App } from "@slack/bolt";

const app = new App({
  // logLevel: 'debug',
  socketMode: true,
  token: config.slack.accessToken,
  appToken: config.slack.appToken,
});

app.message("こんにちは", async ({ message, say }) => {
  await say(`:wave: こんにちは <@${message}>！`);
});

app.command('/echo', async ({ command, ack, respond }) => {
  // コマンドリクエストを確認
  await ack();

  await respond(`${command.text}`);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
