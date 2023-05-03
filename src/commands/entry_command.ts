import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

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

export class EntryCommand extends CommandBase<EntryCommandProps, EntryCommandResult> {
  readonly name: string = "Entry";

  constructor(props: EntryCommandProps) {
    super(props);
  }

  async run(): Promise<EntryCommandResult> {
    const logger = this.logger.createLoggerWithTag("EntryCommand");
    try {
      logger.log("Start");
      await this.controller.goDashboard();
      await this.controller.enableOneClickTrading();
      await this.controller.selectPair(this.props.pairName);
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
    catch (err) {
      logger.log(`[Error] ${err}`);
      return {
        success: false,
        error: err as object,
      };
    }
  }
}
