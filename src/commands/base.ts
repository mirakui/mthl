import { HighLowController } from "src/highlow_controller";
import { MultiLogger } from "src/multi_logger";

export interface CommandPropsBase {
  controller: HighLowController
  logger: MultiLogger
}

export interface CommandResultBase {
  success: boolean;
  error?: object;
}

export class CommandBase<PropsType extends CommandPropsBase, ResultType extends CommandResultBase> {
  private readonly _props: PropsType;
  readonly name: string = "Unknown";

  constructor(props: PropsType) {
    this._props = props;
  }

  get props() {
    return this._props;
  }

  get logger() {
    return this.props.logger;
  }

  get controller() {
    return this.props.controller;
  }

  async run(): Promise<ResultType> {
    throw new Error("Not implemented");
  }
}
