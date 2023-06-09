import { Mthl } from "../mthl";
import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./base";
import { CacheStore } from "../cache_store";

export interface EntryCommandProps extends CommandPropsBase {
  order: "high" | "low";
  timePeriod?: "5m" | "15m";
  pairName: "USDJPY" | "EURJPY" | "EURUSD";
  expectedPrice?: number;
  requestedAt?: Date;
  receivedAt?: Date;
}

export interface EntryCommandResult extends CommandResultBase {
}

export class EntryCommandBuilder extends CommandBuilderBase<EntryCommandProps> {
  constructor(json: any) {
    super(
      {
        properties: {
          order: {
            type: "string",
            enum: ["high", "low"],
          },
          pairName: {
            type: "string",
          },
          timePeriod: {
            type: "string",
            enum: ["5m", "15m"],
          },
          expectedPrice: {
            type: "number",
          },
          comment: {
            type: "string",
          },
        },
        required: ["order", "pairName"],
      },
      json
    );
  }

  build(): EntryCommand {
    return new EntryCommand(this.buildProps());
  }
}

type Semaphores = CacheStore<null>;

export class EntryCommand extends CommandBase<EntryCommandProps, EntryCommandResult> {
  readonly name: string = "Entry";
  static _semaphores?: Semaphores;

  constructor(props: EntryCommandProps) {
    super(props);
  }

  get semaphores(): Semaphores {
    if (EntryCommand._semaphores === undefined) {
      EntryCommand._semaphores = new CacheStore<null>({ ttl: Mthl.config.entry.cooldownMilliSeconds });
    }
    return EntryCommand._semaphores;
  }

  async run(): Promise<EntryCommandResult> {
    const logger = this.logger.createLoggerWithTag("EntryCommand");
    logger.log("Start");
    try {
      const semaphore = this.semaphores.readEntry(this.props.pairName);
      if (semaphore !== undefined) {
        const result = {
          success: false,
          error: `Entry skipped: ${this.props.pairName} is in cooldown until ${semaphore.expiresAt}`,
        }
        return result;
      }
      else {
        const result = this._run();
        this.semaphores.write(this.props.pairName, null);
        return result;
      }
    }
    catch (err: any) {
      logger.log(`[Error] ${err}`);
      const result = {
        success: false,
        error: err.toString(),
      };
      return result;
    }
  }

  private _run = async (): Promise<EntryCommandResult> => {
    const logger = this.logger.createLoggerWithTag("EntryCommand");
    logger.log("Start");
    let result: EntryCommandResult;

    try {
      await this.controller.loginIfNeeded();

      const dashboardPage = await this.controller.gotoDashboard();

      const durationText = this.props.timePeriod ?? "15分";
      const pairName = this.normalizePairName(this.props.pairName);
      const assetOptionResult = await dashboardPage.getAssetOption(pairName, durationText);

      if (assetOptionResult.success === false || assetOptionResult.result === undefined) {
        logger.log(`[Error] ${JSON.stringify(assetOptionResult)}`);
        return {
          success: false,
          error: assetOptionResult.message,
        };
      }

      const tradePage = await this.controller.gotoTradePage(assetOptionResult.result);
      result = await tradePage.enableOneClickTrading();
      if (!result.success) { return result }

      result = await tradePage.setTradeAmount(Mthl.config.entry.tradeAmount);
      if (!result.success) { return result }

      switch (this.props.order) {
        case "high":
          result = await tradePage.entry("high");
          break;
        case "low":
          result = await tradePage.entry("low");
          break;
        default:
          throw new Error(`Invalid order: ${this.props.order}`);
      }
      this.controller.browser.postScreenshot();

      logger.log("End");
      return result;
    }
    catch (err) {
      logger.log(`[Error] ${err}`);
      return { success: false, error: (err as Error).toString() };
    }
  }

  normalizePairName(pairName: string): string {
    if (pairName.match(/^[A-Z]{6}$/)) {
      return pairName.slice(0, 3) + "/" + pairName.slice(3);
    }
    else {
      return pairName;
    }
  }
}
