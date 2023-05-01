import { WebClient } from '@slack/web-api';
import crypto from 'node:crypto';

type ConstructorProps = {
  slack: {
    accessToken: string;
    channel: string;
  },
  tag?: string;
  hash?: string;
  parent?: MultiLogger;
}

export class MultiLogger {
  private readonly props: ConstructorProps;
  private readonly webClient: WebClient;
  private readonly channel: string;

  constructor(props: ConstructorProps) {
    this.props = props;
    this.webClient = new WebClient(props.slack.accessToken);
    this.channel = props.slack.channel;
  }

  async log(message: string): Promise<void> {
    const prefix = this.props.tag ? `[${this.props.tag} ${this.props.hash}] ` : '';
    const logLine = `${prefix}${message}`;
    if (this.props.parent) {
      await this.props.parent.log(logLine);
    }
    else {
      await this._log(logLine);
    }
  }

  private async _log(message: string): Promise<void> {
    console.log(message);
    // await this.webClient.chat.postMessage({
    //   channel: this.channel,
    //   text: message,
    // });
  }

  async logWithTag(tag: string, message: string, func?: (logger: MultiLogger) => {}): Promise<void> {
    const taggedLogger = this.createLoggerWithTag(tag);

    await taggedLogger.log(message);
    if (func) {
      await func(taggedLogger);
      await taggedLogger.log("End");
    }
  }

  createLoggerWithTag(tag: string): MultiLogger {
    const hash = this.generateRandomHash();
    const props: ConstructorProps = { ...this.props, tag, hash, parent: this };
    return new MultiLogger(props);
  }

  private generateRandomHash() {
    const randomNumber = Math.random().toString();
    const md5Hash = crypto.createHash('md5').update(randomNumber).digest('hex');
    return md5Hash.slice(-6);
  }
}
