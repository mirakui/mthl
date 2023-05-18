import { Mthl } from "../mthl";
import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";
import { Throttling } from "../throttling";

export interface EntryCommandProps extends CommandPropsBase {
  order: "high" | "low";
  timePeriod: "5m" | "15m";
  pairName: "USDJPY" | "EURJPY" | "EURUSD";
  expectedPrice?: number;
  requestedAt?: Date;
  receivedAt?: Date;
}

export interface EntryCommandResult extends CommandResultBase {
}

export class EntryCommandBuilder extends CommandBuilderBase<EntryCommandProps> {
  constructor(json: any) {
    super(
      {
        properties: {
          order: {
            type: "string",
            enum: ["high", "low"],
          },
          pairName: {
            type: "string",
          },
          expectedPrice: {
            type: "number",
          },
        },
        required: ["order", "pairName"],
      },
      json
    );
  }

  build(): EntryCommand {
    return new EntryCommand(this.buildProps());
  }
}

export class EntryCommand extends CommandBase<EntryCommandProps, EntryCommandResult> {
  readonly name: string = "Entry";
  static _throttling?: Throttling<EntryCommandResult>;

  constructor(props: EntryCommandProps) {
    super(props);
  }

  get throttling(): Throttling<EntryCommandResult> {
    if (EntryCommand._throttling === undefined) {
      EntryCommand._throttling = new Throttling(Mthl.config.entry.rateLimitPerMinute, 60 * 1000 * 1000);
    }
    return EntryCommand._throttling;
  }

  async run(): Promise<EntryCommandResult> {
    const logger = this.logger.createLoggerWithTag("EntryCommand");
    const status = this.throttling.status();
    logger.log(`Throttling: ${status}`);
    try {
      return await this.throttling.throttle(this._run);
    }
    catch (err: any) {
      logger.log(`[Error] ${err}`);
      const result = {
        success: false,
        error: err.toString(),
      };
      console.log("result", result, JSON.stringify(err));
      return result;
    }
  }

  private _run = async (): Promise<EntryCommandResult> => {
    const logger = this.logger.createLoggerWithTag("EntryCommand");
    logger.log("Start");
    await this.controller.bringToFront();
    await this.controller.goDashboard();
    await this.controller.enableOneClickTrading();
    await this.controller.selectPair(this.normalizePairName(this.props.pairName));
    switch (this.props.order) {
      case "high":
        await this.controller.entry("high");
        break;
      case "low":
        await this.controller.entry("low");
        break;
      default:
        throw new Error(`Invalid order: ${this.props.order}`);
    }
    logger.log("End");
    return {
      success: true,
    };
  }

  normalizePairName(pairName: string): string {
    if (pairName.match(/^[A-Z]{6}$/)) {
      return pairName.slice(0, 3) + "/" + pairName.slice(3);
    }
    else {
      return pairName;
    }
  }
}
