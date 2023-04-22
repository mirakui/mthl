export interface CommandPropsBase {

}

export interface CommandResultBase {
  success: boolean;
  error?: object;
}

export class CommandBase<PropsType extends CommandPropsBase, ResultType extends CommandResultBase> {
  private readonly _props: PropsType;

  constructor(props: PropsType) {
    this._props = props;
  }

  get props() {
    return this._props;
  }

  async run(): Promise<ResultType> {
    throw new Error("Not implemented");
  }
}
