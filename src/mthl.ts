import { Config, ConfigParams } from './config';
import { HighLowController } from './highlow_controller';
import { MultiLogger } from './multi_logger';
import { Server } from './server';

type ConstructorProps = {
  config: ConfigParams;
  logger: MultiLogger;
  server: Server;
  controller: HighLowController;
}

export class Mthl {
  private static _singleton: Mthl;
  private _config: ConfigParams;
  private _logger: MultiLogger;
  private _server: Server;
  private _controller: HighLowController;

  constructor(props: ConstructorProps) {
    this._config = props.config;
    this._logger = props.logger;
    this._server = props.server;
    this._controller = props.controller;
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

  static setup() {
    const config = Config.load();

    const logger = new MultiLogger({
      slack: config.slack
    });

    const server = new Server({
      pipeName: config.server.pipeName
    })

    const controller = new HighLowController()

    Mthl._singleton = new Mthl({ config, logger, server, controller });
  }

  static start() {
    Mthl.logger.log("Start!");
    Mthl.server.start();
  }
}
