import { Browser } from "../browser";
import { Retry } from "../retry";
import { TradingHistoryController, TradingHistoryPage, TradingHistoryStateRequest } from "./trading_history";

export type PageType = "login" | "trading_history" | "dashboard" | "unknown";

export interface PageState {
  url: string;
  login: boolean;
  pageType: PageType;
}

export interface PageStateRequest {
  pageType: PageType;
}

export class PageModel {

}

export class PageControllerError extends Error {
}

export class PageController {
  browser: Browser;
  HIGHLOW_URL_BASE = "https://highlow.com";
  HIGHLOW_APP_URL_BASE = "https://app.highlow.com";

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async guessState(): Promise<PageState> {
    const url = this.browser.page.url();
    const pageType = this.guessPageType();
    // 簡易判定: ログイン状態ならログインページには行かないはず
    const login = pageType !== "login";
    return { url, login, pageType };
  }

  guessPageType(): PageType {
    const url = this.browser.page.url();
    if (url.match(/\/login$/)) {
      return "login";
    }
    else if (url.match(/\/my-account\/trading\/trade-action-history/)) {
      return "trading_history";
    }
    else {
      return "unknown";
    }
  }

  async doRequest(request: PageStateRequest): Promise<PageModel> {
    throw new Error("Not implemented");
  }
}

export class PageStateResolver {
  browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async changeState(request: TradingHistoryStateRequest): Promise<TradingHistoryPage>;

  async changeState(request: TradingHistoryStateRequest | PageStateRequest): Promise<TradingHistoryPage | PageModel> {
    if (request.pageType == "trading_history") {
      const controller = new TradingHistoryController(this.browser);
      return controller.doRequest(request);
    }
    else {
      throw new Error("Not implemented");
    }
  }
}
