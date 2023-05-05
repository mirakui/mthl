import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";

export interface EchoCommandProps extends CommandPropsBase {
  message: string;
}

export interface EchoCommandResult extends CommandResultBase {
}

export class EchoCommandBuilder extends CommandBuilderBase<EchoCommandProps> {
  readonly name = "Echo";

  constructor(json: any) {
    super(
      {
        properties: {
          order: {
            type: "string",
            enum: ["high", "low"],
          },
          message: {
            type: "string",
          },
        },
        required: ["message"],
      },
      json
    );
  }

  build(): EchoCommand {
    return new EchoCommand(this.buildProps());
  }
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
