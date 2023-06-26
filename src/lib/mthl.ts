import { CommandProcessor } from './command_processor';
import { Config, ConfigParams } from './config';
import { Cron } from './cron';
import { HighLowController } from './highlow_controller';
import { MultiLogger } from './multi_logger';
import { Server } from './server';
import { SlackBot } from './slack_bot';
import { Statistics } from './statistics';

type ConstructorProps = {
  config: ConfigParams;
  logger: MultiLogger;
  server: Server;
  controller: HighLowController;
  processor: CommandProcessor;
  stats: Statistics;
  slackBot: SlackBot;
  cron: Cron;
}

export class Mthl {
  private static _config?: ConfigParams;
  private static _logger?: MultiLogger;
  private static _server?: Server;
  private static _controller?: HighLowController;
  private static _processor?: CommandProcessor;
  private static _stats?: Statistics;
  private static _slackBot?: SlackBot;
  private static _cron?: Cron;

  static get config() {
    if (Mthl._config === undefined) {
      Mthl._config = Config.load();
    }
    return Mthl._config;
  }

  static get logger() {
    if (Mthl._logger === undefined) {
      Mthl._logger = new MultiLogger({
        slack: Mthl.config.slack
      });
    }
    return Mthl._logger;
  }

  static get server() {
    if (Mthl._server === undefined) {
      Mthl._server = new Server({
        pipeName: Mthl.config.server.pipeName
      })
    }
    return Mthl._server;
  }

  static get controller() {
    if (Mthl._controller === undefined) {
      throw new Error("Controller is not initialized");
    }
    return Mthl._controller;
  }

  static get processor() {
    if (Mthl._processor === undefined) {
      Mthl._processor = new CommandProcessor();
    }
    return Mthl._processor;
  }

  static get stats() {
    if (Mthl._stats === undefined) {
      Mthl._stats = new Statistics();
    }
    return Mthl._stats;
  }

  static get slackBot() {
    if (Mthl._slackBot === undefined) {
      const config = Mthl.config.slack;
      Mthl._slackBot = new SlackBot({ botToken: config.accessToken, appToken: config.appToken });
    }
    return Mthl._slackBot;
  }

  static get cron() {
    if (Mthl._cron === undefined) {
      Mthl._cron = new Cron(Mthl.config.cron);
    }
    return Mthl._cron;
  }

  static async start() {
    Mthl.logger.log("Start!");
    Mthl._controller = await HighLowController.init(Mthl.config.browser);
    Mthl.server.start();
    Mthl.slackBot.start();
    Mthl.cron.start();
  }
}
