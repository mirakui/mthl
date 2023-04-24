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
      return await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
    } else {
      console.log("Launching new browser");
      return await puppeteer.launch({
        headless: false,
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
    await this.goto(this.dashboardUrl);

    await page.waitForNavigation({ waitUntil: "networkidle2" });
    await page.waitForSelector("div#ChangingStrike0");
    const highlowBtn = await page.$("div#ChangingStrike0");
    if (highlowBtn === null) {
      throw new HighLowControllerError("Cannot find highlow button");
    }
    highlowBtn.click();
  }

  async selectPair(pairName: string) {
    const page = await this.getPage();
    if (page.url() !== this.dashboardUrl) {
      await this.goDashboard();
    }

    // page.$x(`//span[contains(text(),"${pairName}")]`)
    // page.$x('//div[contains(@class,"OptionItem_container")]//span[contains(@class,"OptionItem_ticker") and contains(text(), "USD/JPY")]')

    const containers = await page.$$('div[class*="OptionItem_container"]')
    for (let container of containers) {
      const ticker = await container.$eval('span[class*="OptionItem_ticker"]', elm => elm.textContent);
      const duration = await container.$eval('span[class*="OptionItem_duration"]', elm => elm.textContent);
      console.log("ticker: " + ticker, ", duration: " + duration);
      if (ticker == pairName && duration == "15分") {
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      }
    }
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
    if (page.url() !== url) {
      console.log("Fetching: " + url);
      await page.goto(url);
    }
    if (page.url().match(/\/login/)) {
      // await this.login();
      console.log("ブラウザからログインしてください");
    }
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
