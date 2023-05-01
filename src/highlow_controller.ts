import * as puppeteer from 'puppeteer';
import { Mthl } from './mthl';

const HIGHLOW_URL_BASE = 'https://highlow.com';
const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';

export class HighLowControllerError extends Error { }

export class HighLowController {
  _browser?: puppeteer.Browser;
  _page?: puppeteer.Page;

  constructor() {
  }

  get logger() {
    return Mthl.logger;
  }

  async getBrowser() {
    if (this._browser === undefined) {
      this._browser = await this.launchBrowser();
    }
    return this._browser;
  }

  async launchBrowser(): Promise<puppeteer.Browser> {
    const wsEndpoint = process.env["WS_ENDPOINT"];
    if (wsEndpoint) {
      console.log("Connecting to existing browser: " + wsEndpoint);
      return await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: null
      });
    } else {
      console.log("Launching new browser");
      return await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async getPage(): Promise<puppeteer.Page> {
    if (this._page === undefined) {
      const browser = await this.getBrowser();
      if (browser.pages.length > 0) {
        this._page = browser.pages[browser.pages.length - 1] as puppeteer.Page;
      }
      else {
        console.log("newPage");
        this._page = await browser.newPage();
      }
    }
    return this._page;
  }

  async close() {
    await this._browser?.close();
  }

  async goTradingHistory() {
    const url = `${HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`;
    await this.goto(url);
  }

  get dashboardUrl() {
    if (Mthl.config.account === "demo") {
      return `${HIGHLOW_APP_URL_BASE}/quick-demo`;
    } else {
      return `${HIGHLOW_APP_URL_BASE}/`;
    }
  }

  async goDashboard() {
    const page = await this.getPage();
    if (page.url() === this.dashboardUrl) {
      return;
    }
    const logger = this.logger.createLoggerWithTag("goDashboard");
    logger.log("Start");
    await this.goto(this.dashboardUrl);

    const selector = "div#ChangingStrike0";
    logger.log(`Wait for selector: ${selector}`);
    await page.waitForSelector(selector);
    logger.log(`Click: ${selector}`);
    await page.$eval(selector, elm => elm.click());
    logger.log("End");
  }

  async selectPair(pairName: string) {
    const page = await this.getPage();
    const logger = this.logger.createLoggerWithTag("selectPair");

    logger.log("Start");
    await this.goDashboard();

    // page.$x(`//span[contains(text(),"${pairName}")]`)
    // page.$x('//div[contains(@class,"OptionItem_container")]//span[contains(@class,"OptionItem_ticker") and contains(text(), "USD/JPY")]')

    const selector = 'div[class*="OptionItem_container"]'
    // await page.waitForSelector(selector);
    logger.log(`Wait for network idle`);
    await page.waitForNetworkIdle();
    const containers = await page.$$(selector);
    logger.log(`containers: ${containers.length}`);
    for (let container of containers) {
      const ticker = await container.$eval('span[class*="OptionItem_ticker"]', elm => elm.textContent);
      const duration = await container.$eval('span[class*="OptionItem_duration"]', elm => elm.textContent);
      if (ticker == pairName && duration == "15分") {
        logger.log(`Click: ticker=${ticker}, duration=${duration}`);
        await container.click();
        // const pairNameFunction = `$(\"div[class^='ChartInfo_optionAssetName']\").textContent === '${pairName}'`
        // logger.log(`waitForFunction: ${pairNameFunction}`);
        logger.log(`Wait for network idle`);
        await page.waitForNetworkIdle();
        const currentPairName = await page.$eval("div[class^='ChartInfo_optionAssetName']", elm => elm.textContent);
        if (currentPairName === pairName) {
          logger.log("End");
          return;
        }
        else {
          throw new HighLowControllerError(`Failed to change pair: ${currentPairName} -> ${pairName}`);
        }
      }
    }

    throw new HighLowControllerError(`Pair not found: ${pairName}`);
  }

  async enableOneClickTrading() {
    const page = await this.getPage();
    const logger = this.logger.createLoggerWithTag("enableOneClickTrading");
    logger.log("Start");
    await this.goDashboard();
    const selector = "div[class^='TradePanel_container'] div[class*='Switch_switch']";
    logger.log(`Wait for selector: ${selector}`);
    await page.waitForSelector(selector);
    logger.log(`Enable: ${selector}`);
    await page.$eval(selector, (elm) => {
      if (elm.className.includes("false")) {
        elm.click();
      }
    });
  }

  async entry(order: "high" | "low") {
    const page = await this.getPage();
    const logger = this.logger.createLoggerWithTag("entry");

    logger.log("Start");
    await this.goDashboard();

    const selector = `div[class^='TradePanel_container'] div[class*='TradePanel_${order}']`;
    logger.log(`Wait for selector: ${selector}`);
    await page.waitForSelector(selector);
    logger.log(`Click: ${selector}`);
    await page.$eval(selector, (elm) => {
      (elm as HTMLDivElement).click();
    });

    logger.log("End");
  }

  async fetchMarketClosed(): Promise<boolean> {
    const page = await this.getPage();
    await this.goto(`${HIGHLOW_APP_URL_BASE}/`);
    const countdownDiv = await page.$("div[class^='MarketClosed_countdown']");
    return countdownDiv !== null;
  }

  async fetchBalance(): Promise<number> {
    const page = await this.getPage();
    await this.goto(`${HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`);
    const balanceSpan = await page.$("span.emphasized.eng.accountBalancePolled");
    const balance = await balanceSpan?.evaluate(node => node.textContent);
    return this.parseBalance(balance || '0');
  }

  private parseBalance(balance: string): number {
    return parseFloat(balance.replace(/[¥,]/g, ''));
  }

  async goto(url: string) {
    const page = await this.getPage();
    const logger = this.logger.createLoggerWithTag("goto");
    logger.log(url);
    if (page.url() !== url) {
      logger.log(`page.goto: ${url}`);
      await page.goto(url);
      // logger.log("page.waitForNavigation");
      // await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 });
      // logger.log("page.waitForNavigation: done");
    }
    else {
      logger.log("Already in the page");
    }
    if (page.url().match(/\/login/)) {
      logger.log("Please login manually");
    }
    logger.log("End");
  }

  async login() {
    const page = await this.getPage();
    if (!page.url().match(/\/login/)) {
      await this.goto(`${HIGHLOW_APP_URL_BASE}/login`);
    }
    await page.waitForSelector('input#login-username');
    await page.type('input#login-username', 'username', { delay: 100 });
    await page.type('input#login-password', 'password', { delay: 100 });
    const btn = await page.$('#login-submit-button');
    await btn?.click();
  }
}
