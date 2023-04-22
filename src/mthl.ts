import { Config, ConfigParams } from './config';
import { MultiLogger } from './multi_logger';
import { Server } from './server';

type ConstructorProps = {
  config: ConfigParams;
  logger: MultiLogger;
  server: Server;
}

export class Mthl {
  private static _singleton: Mthl;
  private _config: ConfigParams;
  private _logger: MultiLogger;
  private _server: Server;

  constructor(props: ConstructorProps) {
    this._config = props.config;
    this._logger = props.logger;
    this._server = props.server;
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

  static setup() {
    const config = Config.load();

    const logger = new MultiLogger({
      slack: config.slack
    });

    const server = new Server({
      pipeName: config.server.pipeName
    })

    Mthl._singleton = new Mthl({ config, logger, server });
  }

  static start() {
    Mthl.logger.log("Start!");
    Mthl.server.start();
  }
}
