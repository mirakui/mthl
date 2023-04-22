import * as puppeteer from 'puppeteer';

const HIGHLOW_URL_BASE = 'https://highlow.com';

export class HighLowController {
  _browser?: puppeteer.Browser;
  _page?: puppeteer.Page;

  constructor() {
  }

  async getBrowser() {
    if (this._browser === undefined) {
      this._browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this._browser;
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

    const page = await this.getPage();
    await page.goto(url);
  }

  async login() {
  }
}

(async () => {
  const controller = new HighLowController();
  await controller.goTradingHistory();
  setTimeout(() => {
    controller.close();
  }
    , 30000);
})();
