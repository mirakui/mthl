import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";

export interface CheckBalanceCommandProps extends CommandPropsBase {
  force?: boolean;
}

export interface CheckBalanceCommandResult extends CommandResultBase {
}

export class CheckBalanceCommandBuilder extends CommandBuilderBase<CheckBalanceCommandProps> {
  constructor(json: any) {
    super(
      {
        properties: {
          force: {
            type: "boolean",
          },
        },
      },
      json
    );
  }

  build(): CheckBalanceCommand {
    const props: CheckBalanceCommandProps = {
      silent: true,
      ...this.buildProps()
    };
    return new CheckBalanceCommand(props);
  }
}


export class CheckBalanceCommand extends CommandBase<CheckBalanceCommandProps, CheckBalanceCommandResult> {
  readonly name = "CheckBalance";
  static previousBalance?: number;

  get previousBalance(): number | undefined {
    return CheckBalanceCommand.previousBalance;
  }

  set previousBalance(value: number | undefined) {
    CheckBalanceCommand.previousBalance = value as number;
  }

  async run(): Promise<CheckBalanceCommandResult> {
    const logger = this.logger.createLoggerWithTag("CheckBalanceCommand");
    try {
      logger.log("Start");
      await this.controller.bringToFront();
      const currentBalance = await this.controller.fetchBalance();
      logger.log(`Previous=${this.previousBalance}, Current=${currentBalance}`);

      // first time
      if (this.previousBalance === undefined) {
        const balanceStr = this.formatPrice(currentBalance);
        this.logger.postMessage(`:moneybag: *Current Balance *\n${balanceStr}\n`);
        await this.controller.postScreenshot();
      }
      else if (this.previousBalance !== currentBalance || this.props.force) {
        const diff = currentBalance - this.previousBalance;
        const diffStr = this.formatPrice(diff, true);
        const balanceStr = this.formatPrice(currentBalance);
        let emoji = diff >= 0 ? ":moneybag:" : ":money_with_wings:";

        this.logger.postMessage(`${emoji} *Balance updated*\n${balanceStr} (${diffStr})\n`);
        await this.controller.postScreenshot();
      }
      this.previousBalance = currentBalance;

      logger.log("Go back to dashboard");
      await this.controller.gotoDashboard();
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

  formatPrice(num: number, plus?: boolean): string {
    const sign = num >= 0 ? (plus ? "+" : "") : "-";
    const abs = Math.abs(num).toLocaleString("en-US");
    return `${sign}¥${abs}`;
  }

}
