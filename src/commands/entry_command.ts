import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface EntryCommandProps extends CommandPropsBase {
  direction: "up" | "down";
  timeRange: "foo" | "bar";
  expectedValue: number;
  requestedAt: Date;
  receivedAt: Date;
}

export interface EntryCommandResult extends CommandResultBase {
}

export class EntryCommand extends CommandBase<EntryCommandProps, EntryCommandResult> {
  constructor(props: EntryCommandProps) {
    super(props);
  }

  async run(): Promise<EntryCommandResult> {
    return {
      success: true,
    };
  }
}
