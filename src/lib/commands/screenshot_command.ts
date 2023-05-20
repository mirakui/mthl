import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";

export interface ScreenshotCommandProps extends CommandPropsBase {
}

export interface ScreenshotCommandResult extends CommandResultBase {
}

export class ScreenshotCommandBuilder extends CommandBuilderBase<ScreenshotCommandProps> {
  constructor(json: any) {
    super({}, json);
  }

  build(): ScreenshotCommand {
    const props: ScreenshotCommandProps = {
      ...this.buildProps()
    };
    return new ScreenshotCommand(props);
  }
}


export class ScreenshotCommand extends CommandBase<ScreenshotCommandProps, ScreenshotCommandResult> {
  readonly name = "Screenshot";

  async run(): Promise<ScreenshotCommandResult> {
    const logger = this.logger.createLoggerWithTag("ScreenshotCommand");
    try {
      logger.log("Start");
      await this.controller.bringToFront();
      await this.controller.postScreenshot();
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
