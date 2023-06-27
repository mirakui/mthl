import { Browser } from "../browser";
import { PageController, PageControllerError, PageModel, PageState, PageStateRequest, PageStateResolver } from "./page";

export interface TradingHistoryState extends PageState {
  balance?: number;
}

export interface TradingHistoryStateRequest extends PageStateRequest {
}

// export class TradingHistoryController extends PageController {
export class TradingHistoryController {
  browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async doRequest(request: TradingHistoryStateRequest): Promise<TradingHistoryPage> {
    throw new Error("Not implemented");
    // const state = await this.guessState();
    // if (!state.login) {
    //   await this.login();
    // }
    // if (state.pageType !== "trading_history") {
    //   await this.browser.goto(`${this.HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`);
    // }
    // throw new Error("Not implemented");
  }

  async scanState(): Promise<TradingHistoryState> {
    throw new Error("Not implemented");
  }

  async login() {

  }

  async matchRequest(request: TradingHistoryStateRequest, state: TradingHistoryState): Promise<boolean> {
    if (request.pageType !== "trading_history") {
      throw new PageControllerError(`Invalid request: ${request}`);
    }
    if (state.pageType !== "trading_history") {
      return false;
    }
    if (state.balance === undefined) {
      return false;
    }

    return true;
  }
}

// export class TradingHistoryPage extends PageModel {
export class TradingHistoryPage {


}
