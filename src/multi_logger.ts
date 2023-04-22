import { WebClient } from '@slack/web-api';

type ConstructorProps = {
  webClient: WebClient;
  channel: string;
}

export class MultiLogger {
  private readonly webClient: WebClient;
  private readonly channel: string;

  constructor(props: ConstructorProps) {
    this.webClient = props.webClient;
    this.channel = props.channel;
  }

  async log(message: string): Promise<void> {
    console.log(message);
    await this.webClient.chat.postMessage({
      channel: this.channel,
      text: message,
    });
  }
}
