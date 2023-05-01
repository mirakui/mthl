import { CommandProcessor } from './command_processor';
import { Config, ConfigParams } from './config';
import { HighLowController } from './highlow_controller';
import { MultiLogger } from './multi_logger';
import { Server } from './server';

type ConstructorProps = {
  config: ConfigParams;
  logger: MultiLogger;
  server: Server;
  controller: HighLowController;
  processor: CommandProcessor;
}

export class Mthl {
  private static _singleton: Mthl;
  private _config: ConfigParams;
  private _logger: MultiLogger;
  private _server: Server;
  private _controller: HighLowController;
  private _processor: CommandProcessor;

  constructor(props: ConstructorProps) {
    this._config = props.config;
    this._logger = props.logger;
    this._server = props.server;
    this._controller = props.controller;
    this._processor = props.processor;
  }

  static get config() {
    return Mthl._singleton._config;
  }

  static get logger() {
    return Mthl._singleton._logger;
  }

  static get server() {
    return Mthl._singleton._server;
  }

  static get controller() {
    return Mthl._singleton._controller;
  }

  static get processor() {
    return Mthl._singleton._processor;
  }

  static setup() {
    const config = Config.load();

    const logger = new MultiLogger({
      slack: config.slack
    });

    const server = new Server({
      pipeName: config.server.pipeName
    })

    const controller = new HighLowController();

    const processor = new CommandProcessor();

    Mthl._singleton = new Mthl({ config, logger, server, controller, processor });
  }

  static async start() {
    Mthl.logger.log("Start!");
    await Mthl.controller.goDashboard();
    Mthl.server.start();
  }
}
