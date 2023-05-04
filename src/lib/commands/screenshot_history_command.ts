import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface ScreenshotHistoryCommandProps extends CommandPropsBase {
}

export interface ScreenshotHistoryCommandResult extends CommandResultBase {
}

export class ScreenshotHistoryCommand extends CommandBase<ScreenshotHistoryCommandProps, ScreenshotHistoryCommandResult> {
  async run(): Promise<ScreenshotHistoryCommandResult> {
    const result: ScreenshotHistoryCommandResult = {
      success: true,
    };

    return result;
  }
}
