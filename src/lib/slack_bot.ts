import { App } from "@slack/bolt";
import { MultiLogger } from "./multi_logger";
import { Mthl } from "./mthl";

type ConstructorProps = {
  botToken: string;
  appToken: string;
}

export class SlackBot {
  private app: App;
  private _logger?: MultiLogger;

  constructor(props: ConstructorProps) {
    this.app = new App({
      // logLevel: 'debug',
      socketMode: true,
      token: props.botToken,
      appToken: props.appToken,
    });
  }

  get logger() {
    if (this._logger === undefined) {
      this._logger = Mthl.logger.createLoggerWithTag("SlackBot");
    }
    return this._logger;
  }

  async start() {
    this.app.shortcut("stats", async ({ shortcut, ack, context, logger }) => {
      this.logger.log("Received shortcut: stats");
      ack();

      try {
        Mthl.server.onData('{ "command": "Stats", "clear": false }');
      }
      catch (error) {
        this.logger.log(`[ERROR] ${error}`);
      }
    });

    this.app.shortcut("checkbalance", async ({ shortcut, ack, context, logger }) => {
      this.logger.log("Received shortcut: checkbalance");
      ack();

      try {
        Mthl.server.onData('{ "command": "CheckBalance", "force": true }');
      }
      catch (error) {
        this.logger.log(`[ERROR] ${error}`);
      }
    });

    this.app.shortcut("warmup", async ({ shortcut, ack, context, logger }) => {
      this.logger.log("Received shortcut: warmup");
      ack();

      try {
        Mthl.server.onData('{ "command": "Warmup" }');
      }
      catch (error) {
        this.logger.log(`[ERROR] ${error}`);
      }
    });

    this.app.shortcut("screenshot", async ({ shortcut, ack, context, logger }) => {
      this.logger.log("Received shortcut: screenshot");
      ack();

      try {
        Mthl.server.onData('{ "command": "Screenshot" }');
      }
      catch (error) {
        this.logger.log(`[ERROR] ${error}`);
      }
    });

    this.app.shortcut("shutdown", async ({ shortcut, ack, context, logger }) => {
      this.logger.log("Received shortcut: shutdown");
      ack();

      try {
        await this.logger.postMessage("OK. Shutting down...");
        process.exit(0);
      }
      catch (error) {
        this.logger.log(`[ERROR] ${error}`);
      }
    });

    await this.app.start();
    this.logger.log("Started");
  }
}
