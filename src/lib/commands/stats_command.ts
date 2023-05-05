import { formatISO } from "date-fns";
import { Mthl } from "../mthl";
import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase, CommandSchema } from "./base";

export interface StatsCommandProps extends CommandPropsBase {
  clear?: boolean;
}

export interface StatsCommandResult extends CommandResultBase {
}

export class StatsCommandBuilder extends CommandBuilderBase<StatsCommandProps> {
  constructor(json: any) {
    super(
      {
        properties: {
          clear: {
            type: "boolean"
          }
        }
      },
      json
    );
  }

  build(): StatsCommand {
    const props: StatsCommandProps = {
      clear: true,
      silent: true,
      ...this.buildProps()
    };
    return new StatsCommand(props);
  }
}

export class StatsCommand extends CommandBase<StatsCommandProps, StatsCommandResult> {
  readonly name = "Stats";

  constructor(props: StatsCommandProps) {
    super(props);
  }

  async run(): Promise<StatsCommandResult> {
    const logger = this.logger.createLoggerWithTag("StatsCommand");
    try {
      logger.log("Start");
      const time = formatISO(new Date());
      const message = `:bar_chart: *Statistics at ${time}* (clear=${this.props.clear})\n` +
        "```\n" +
        `${Mthl.stats.toString()}\n` +
        "```";
      logger.postMessage(message);
      if (this.props.clear) {
        Mthl.stats.clear();
      }
      logger.log("End");
      return {
        success: true,
      };
    }
    catch (err: any) {
      logger.log(`[Error] ${err}`);
      return {
        success: false,
        error: err.toString(),
      };
    }
  }
}
