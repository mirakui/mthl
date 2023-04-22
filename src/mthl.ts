import { WebClient } from '@slack/web-api';
import { Config, ConfigParams } from './config';
import { MultiLogger } from './multi_logger';

type ConstructorProps = {
  config: ConfigParams;
  logger: MultiLogger;
}

export class Mthl {
  private static _singleton: Mthl;
  private _config: ConfigParams;
  private _logger: MultiLogger;

  constructor(props: ConstructorProps) {
    this._config = props.config;
    this._logger = props.logger;
  }

  static get config() {
    return Mthl._singleton._config;
  }

  static get logger() {
    return Mthl._singleton._logger;
  }

  static setup() {
    const config = Config.load();
    console.log(config.slack.accessToken);
    const logger = new MultiLogger({
      webClient: new WebClient(config.slack.accessToken),
      channel: config.slack.channel,
    });
    Mthl._singleton = new Mthl({ config, logger });
  }

  static start() {
    Mthl.logger.log("Start!");
  }
}
