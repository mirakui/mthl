import { CommandBase, CommandPropsBase, CommandResultBase } from "./base";

export interface EchoCommandProps extends CommandPropsBase {
  message: string;
}

export interface EchoCommandResult extends CommandResultBase {
}

export class EchoCommand extends CommandBase<EchoCommandProps, EchoCommandResult> {
  constructor(props: EchoCommandProps) {
    super(props);
  }

  async run(): Promise<EchoCommandResult> {
    this.logger.log(this.props.message);
    return {
      success: true,
    };
  }
}
