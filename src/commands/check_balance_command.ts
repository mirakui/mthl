import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface CheckBalanceCommandProps extends CommandPropsBase {
}

export interface CheckBalanceCommandResult extends CommandResultBase {
  balance: number;
}

export class CheckBalanceCommand extends CommandBase<CheckBalanceCommandProps, CheckBalanceCommandResult> {
  async run(): Promise<CheckBalanceCommandResult> {
    const result: CheckBalanceCommandResult = {
      success: true,
      balance: 0
    };

    return result;
  }
}
