import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";

export interface DumpCommandProps extends CommandPropsBase {
}

export interface DumpCommandResult extends CommandResultBase {
}

export class DumpCommandBuilder extends CommandBuilderBase<DumpCommandProps> {
  constructor(json: any) {
    super({}, json);
  }

  build(): DumpCommand {
    const props: DumpCommandProps = {
      ...this.buildProps()
    };
    return new DumpCommand(props);
  }
}


export class DumpCommand extends CommandBase<DumpCommandProps, DumpCommandResult> {
  readonly name = "Dump";

  async run(): Promise<DumpCommandResult> {
    const logger = this.logger.createLoggerWithTag("DumpCommand");
    try {
      logger.log("Start");
      await this.controller.bringToFront();
      await this.controller.postDump();
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
