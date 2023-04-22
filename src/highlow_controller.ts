import * as puppeteer from 'puppeteer';

const HIGHLOW_URL_BASE = 'https://highlow.com';
const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';

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

  async getPage() {
    if (this._page === undefined) {
      const browser = await this.getBrowser();
      this._page = await browser.newPage();
    }
    return this._page;
  }

  async close() {
    await this._browser?.close();
  }

  async goTradingHistory() {
    const url = `${HIGHLOW_URL_BASE}/my-account/trading/trade-action-history`;

    this.goto(url);
  }

  async goto(url: string) {
    const page = await this.getPage();
    await page.goto(url);
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

(async () => {
  const controller = new HighLowController();
  await controller.goTradingHistory();
  setInterval(() => { }, 10000);
})();
