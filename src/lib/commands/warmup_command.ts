import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";

export interface WarmupCommandProps extends CommandPropsBase {
}

export interface WarmupCommandResult extends CommandResultBase {
}

export class WarmupCommandBuilder extends CommandBuilderBase<WarmupCommandProps> {
  constructor(json: any) {
    super({}, json);
  }

  build(): WarmupCommand {
    const props: WarmupCommandProps = {
      ...this.buildProps()
    };
    return new WarmupCommand(props);
  }
}


export class WarmupCommand extends CommandBase<WarmupCommandProps, WarmupCommandResult> {
  readonly name = "Warmup";

  async run(): Promise<WarmupCommandResult> {
    const logger = this.logger.createLoggerWithTag("WarmupCommand");
    try {
      logger.log("Start");
      await this.controller.warmup();
      logger.log("End");
      return {
        success: true,
      }
    }
    catch (err: any) {
      this.logger.log(`[Error] ${err}`);
      return {
        success: false,
        error: err.toString(),
      };
    }
  }
}
