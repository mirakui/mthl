import { ErrorCode, CodedError, FilesUploadV2Arguments, WebClient, WebAPIPlatformError } from '@slack/web-api';
import { formatISO } from 'date-fns';
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
  private channelId?: string;

  constructor(props: ConstructorProps) {
    this.props = props;
    this.webClient = new WebClient(props.slack.accessToken);
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
    const time = formatISO(new Date());
    console.log(`${time} ${message}`);
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

  async uploadFile(args: FilesUploadV2Arguments): Promise<void> {
    try {
      const channelId = await this.getChannelId();
      await this.webClient.filesUploadV2({ channel_id: channelId, request_file_info: false, ...args });
    }
    catch (_err) {
      let errorDetail = "";
      const codedError = (_err as CodedError).code
      if (codedError === ErrorCode.PlatformError) {
        const err = _err as WebAPIPlatformError;
        errorDetail = `code=${err.code} data=${JSON.stringify(err.data)}`;
      }
      else {
        errorDetail = `Unexpected error: ${_err}`;
      }
      this.logWithTag("uploadFile", `[Error] ${errorDetail}"`);
    }
  }

  async uploadImage(image: Buffer): Promise<void> {
    const filename = `image-${formatISO(new Date())}.png`;
    this.logWithTag("uploadImage", `filename=${filename}`);
    await this.uploadFile({ file: image, filename: filename, type: "png" });
  }

  async getChannelId() {
    if (this.channelId === undefined) {
      this.channelId = await this.getChannelIdByName(this.props.slack.channel);
    }
    return this.channelId;
  }

  private async getChannelIdByName(channelName: string): Promise<string> {
    const result: any = await this.webClient.conversations.list();
    const channels = result.channels;

    for (const channel of channels) {
      if (channel.name === channelName) {
        return channel.id;
      }
    }

    throw new Error(`Channel not found: ${channelName}`);
  }

  async postMessage(message: string): Promise<void> {
    const channel = await this.getChannelId();
    this.logWithTag("postMessage", `#${this.props.slack.channel}: ${message}`)
    await this.webClient.chat.postMessage({
      channel,
      text: message,
    })
  }
}
