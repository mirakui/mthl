import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface ListAvailablePairsCommandProps extends CommandPropsBase {
}

export interface ListAvailablePairsCommandResult extends CommandResultBase {
  pairs: string[];
}

export class ListAvailablePairsCommand extends CommandBase<ListAvailablePairsCommandProps, ListAvailablePairsCommandResult> {
  async run(): Promise<ListAvailablePairsCommandResult> {
    const result: ListAvailablePairsCommandResult = {
      success: true,
      pairs: []
    };

    return result;
  }
}
