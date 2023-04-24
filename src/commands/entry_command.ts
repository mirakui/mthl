import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface EntryCommandProps extends CommandPropsBase {
  direction: "up" | "down";
  timePeriod: "5m" | "15m";
  pairName: "USDJPY" | "EURJPY" | "EURUSD";
  expectedPrice?: number;
  requestedAt?: Date;
  receivedAt?: Date;
}

export interface EntryCommandResult extends CommandResultBase {
}

export class EntryCommand extends CommandBase<EntryCommandProps, EntryCommandResult> {
  constructor(props: EntryCommandProps) {
    super(props);
  }

  async run(): Promise<EntryCommandResult> {
    try {
      this.controller.goDashboard();
      this.controller.selectPair(this.props.pairName);
      return {
        success: true,
      };
    }
    catch (err) {
      console.log("Error: ", err);
      return {
        success: false,
      };
    }
  }
}
