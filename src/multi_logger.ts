import { WebClient } from '@slack/web-api';

type ConstructorProps = {
  slack: {
    accessToken: string;
    channel: string;
  }
}

export class MultiLogger {
  private readonly webClient: WebClient;
  private readonly channel: string;

  constructor(props: ConstructorProps) {
    this.webClient = new WebClient(props.slack.accessToken);
    this.channel = props.slack.channel;
  }

  async log(message: string): Promise<void> {
    console.log(message);
    await this.webClient.chat.postMessage({
      channel: this.channel,
      text: message,
    });
  }
}
