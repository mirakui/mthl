import { Mthl } from "../mthl";
import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface StatsCommandProps extends CommandPropsBase {
  clear?: boolean;
}

export interface StatsCommandResult extends CommandResultBase {
}

export class StatsCommand extends CommandBase<StatsCommandProps, StatsCommandResult> {
  readonly name = "Stats";

  constructor(props: StatsCommandProps) {
    super({ ...props, clear: true });
  }

  async run(): Promise<StatsCommandResult> {
    const logger = this.logger.createLoggerWithTag("StatsCommand");
    try {
      logger.log("Start");
      const message = `:bar_chart: *Statistics*\n\`\`\`\n${Mthl.stats.toString()}\n\`\`\``;
      logger.postMessage(message);
      if (this.props.clear) {
        Mthl.stats.clear();
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
      };
    }
  }
}
