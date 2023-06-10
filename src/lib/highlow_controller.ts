import * as puppeteer from 'puppeteer';
import { Mthl } from './mthl';
import { Browser } from './browser';
import { PageStateResolver } from './pages/page';
import { TradingHistoryStateRequest } from './pages/trading_history';

const HIGHLOW_URL_BASE = 'https://highlow.com';
const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';

export class HighLowControllerError extends Error { }

type HighLowControllerProps = {
  browser: Browser;
  stateResolver: PageStateResolver;
}

export class HighLowController {
  browser: Browser;
  stateResolver: PageStateResolver;

  constructor(props: HighLowControllerProps) {
    this.browser = props.browser;
    this.stateResolver = props.stateResolver;
  }

  // static async init() {
  //   const browser = await Browser.open();
  //   const stateResolver = new PageStateResolver(browser);
  //   return new HighLowController({ browser, stateResolver });
  // }

  get logger() {
    return Mthl.logger;
  }

  async goTradingHistory() {

    const url = `${HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`;
    await this.browser.goto(url);
  }

  get dashboardUrl() {
    if (Mthl.config.account.environment === "demo") {
      return `${HIGHLOW_APP_URL_BASE}/quick-demo`;
    } else {
      return `${HIGHLOW_APP_URL_BASE}/`;
    }
  }

  async goDashboard(force?: boolean) {
    if (!force && this.browser.page.url() === this.dashboardUrl) {
      return;
    }
    const logger = this.logger.createLoggerWithTag("goDashboard");
    logger.log("Start");
    await this.browser.goto(this.dashboardUrl);

    const selector = "div#ChangingStrike0";
    logger.log(`Wait for selector: ${selector}`);
    await this.browser.waitForSelector(selector);
    logger.log(`Click: ${selector}`);
    await this.browser.page.$eval(selector, elm => elm.click());
    logger.log("End");
  }

  async selectPair(pairName: string) {
    const logger = this.logger.createLoggerWithTag("selectPair");

    logger.log("Start");
    await this.goDashboard();

    let found = false;
    await this.browser.waitForSelector('div[class*="OptionItem_container"]').then(async (selector) => {
      const containers = await this.browser.page.$$(selector);
      logger.log(`containers: ${containers.length}`);
      for (let container of containers) {
        const _found = await this.selectPairProcessContainer(container, pairName);
        if (!_found) {
          found = true;
          return;
        }
      }
    });
    if (!found) {
      throw new HighLowControllerError(`Pair not found: ${pairName}`);
    }
  }

  private async selectPairProcessContainer(container: puppeteer.ElementHandle<Element>, pairName: string): Promise<boolean> {
    const logger = this.logger.createLoggerWithTag("selectPairProcessContainer");

    const ticker = await container.$eval('span[class*="OptionItem_ticker"]', elm => elm.textContent);
    const duration = await container.$eval('span[class*="OptionItem_duration"]', elm => elm.textContent);
    if (ticker == pairName && duration == "15分") {
      logger.log(`Click: ticker=${ticker}, duration=${duration}`);
      await container.click();
      await this.browser.waitForSelector("div[class^='ChartInfo_optionAssetName']").then(async (selector) => {
        const currentPairName = await this.browser.page.$eval(selector, elm => elm.textContent);
        if (currentPairName === pairName) {
          logger.log("End");
          return true;
        }
        else {
          throw new HighLowControllerError(`Failed to change pair: ${currentPairName} -> ${pairName}`);
        }
      });
    }
    return false;
  }

  async enableOneClickTrading() {
    const logger = this.logger.createLoggerWithTag("enableOneClickTrading");
    logger.log("Start");
    await this.goDashboard();
    const selector = "div[class^='TradePanel_container'] div[class*='Switch_switch']";
    logger.log(`Wait for selector: ${selector}`);
    await this.browser.waitForSelector(selector);
    logger.log(`Enable: ${selector}`);
    await this.browser.page.$eval(selector, (elm) => {
      if (elm.className.includes("false")) {
        elm.click();
      }
    });
  }

  async entry(order: "high" | "low") {
    const logger = this.logger.createLoggerWithTag("entry");
    logger.log("Start");
    await this.goDashboard();

    const selector = `div[class^='TradePanel_container'] div[class*='TradePanel_${order}']`;
    logger.log(`Wait for selector: ${selector}`);
    await this.browser.waitForSelector(selector);
    logger.log(`Click: ${selector}`);
    await this.browser.page.$eval(selector, (elm) => {
      (elm as HTMLDivElement).click();
    });

    this.browser.postScreenshot();

    logger.log("End");
  }

  async fetchMarketClosed(): Promise<boolean> {
    const page = await this.browser.page;
    await this.browser.goto(`${HIGHLOW_APP_URL_BASE}/`);
    const countdownDiv = await page.$("div[class^='MarketClosed_countdown']");
    return countdownDiv !== null;
  }

  async fetchBalance(): Promise<number> {
    const page = await this.browser.page;
    const logger = this.logger.createLoggerWithTag("fetchBalance");
    logger.log("Start");
    await this.browser.goto(`${HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`);
    const selector = "span.emphasized.eng.accountBalancePolled";
    logger.log(`Wait for selector: ${selector}`);
    await page.waitForSelector(selector);
    logger.log(`Wait for function`);
    await page.waitForFunction(async selector => {
      const elm = document.querySelector(selector);
      return elm !== null && elm.textContent?.match(/[0-9]/)
    }, {}, selector);
    const balance = await page.$eval(selector, elm => elm.textContent);
    this.logger.log(`balance: ${balance}`);
    logger.log("End");
    return this.parseBalance(balance || '0');
  }

  async postScreenshot() {
    await this.browser.postScreenshot();
  }

  async bringToFront() {
    await this.browser.bringToFront();
  }

  async postDump() {
    await this.browser.postDump();
  }

  // async fetchBalance2(): Promise<number> {
  //   const request = new TradingHistoryStateRequest();
  //   const page = await this.stateResolver.changeState(request);
  //   return await page.getBalance();
  // }

  // async changeState(request: TradingHistoryStateRequest): Promise<TradingHistoryState> {
  //   return state;
  // }

  private parseBalance(balance: string): number {
    return parseFloat(balance.replace(/[^0-9\.]/g, ''));
  }
}
