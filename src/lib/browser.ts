import * as puppeteer from "puppeteer";
import { Mthl } from "./mthl";
import { MultiLogger } from "./multi_logger";
import formatISO from "date-fns/formatISO";
import { BrowserConfigParams, ConfigParams } from "./config";
import { Retry } from "./retry";

export class BrowserError extends Error { }

export interface BrowserActionResult<T> {
  success: boolean;
  selector?: string;
  message?: string;
  result?: T;
}

type BrowserProps = {
  browser: puppeteer.Browser;
  page: puppeteer.Page;
  config: BrowserConfigParams;
  logger: MultiLogger;
}

export class Browser {
  config: BrowserConfigParams;
  _browser?: puppeteer.Browser;
  _page?: puppeteer.Page;
  logger: MultiLogger;

  constructor(browserConfig?: BrowserConfigParams) {
    this.config = browserConfig ?? Mthl.config.browser;
    this.logger = Mthl.logger.createLoggerWithTag("Browser");
  }

  get browser(): puppeteer.Browser {
    if (this._browser === undefined) {
      throw new BrowserError("Browser is not open");
    }
    return this._browser;
  }

  get page(): puppeteer.Page {
    if (this._browser === undefined || this._page === undefined) {
      throw new BrowserError("Browser is not open");
    }
    return this._page;
  }


  async open() {
    if (this._browser !== undefined) {
      this.close();
    }
    if (this.config.launch) {
      this._browser = await this.launch();
    }
    else {
      this._browser = await this.connectToWsEndpoint();
    }

    this._page = await this._browser.newPage();
    this._page.setDefaultTimeout(this.config.timeout);
  }

  async launch(): Promise<puppeteer.Browser> {
    let opts: puppeteer.PuppeteerLaunchOptions = {
      headless: this.config.headless,
      defaultViewport: null,
      debuggingPort: this.config.port,
      args: [
        `--user-data-dir=tmp/chrome`,
      ],
    }
    this.logger.log(`Launching new browser: ${JSON.stringify(opts)}`);
    return await puppeteer.launch(opts);
  }

  async connectToWsEndpoint() {
    const wsEndpoint = await this.getWsEndpoint();
    this.logger.log("Connecting to existing browser: " + wsEndpoint);
    return await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null
    });
  }

  async getWsEndpoint(): Promise<string> {
    const logger = this.logger.createLoggerWithTag("getWsEndpoint")
    const url = `http://${this.config.host}:${this.config.port}/json/version`;
    logger.log(`Fetching ${url}`);
    const response = await fetch(url);

    if (response.status !== 200) {
      throw new BrowserError(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    else if (response.body === null) {
      throw new BrowserError(`Failed to fetch: body is null`);
    }

    const body = await response.text();
    logger.log(`body=${body}`);

    const json = JSON.parse(body);
    const wsEndpoint = json.webSocketDebuggerUrl;

    if (wsEndpoint === undefined || wsEndpoint.match(/^ws:/) === null) {
      throw new BrowserError(`Unexpected webSocketDebuggerUrl: ${wsEndpoint}`);
    }
    return wsEndpoint;
  }

  async close() {
    if (this._browser !== undefined) {
      await this._browser?.close();
      this._browser = undefined;
    }
  }

  async goto(url: string): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("goto");
    logger.log(url);
    await this.page.goto(url);
    return { success: true, result: undefined };
  }

  async click(selector: string): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("click");
    logger.log(`Trying to click ${selector}`);
    try {
      await this.page.waitForSelector(selector);
      await this.page.$eval(selector, elm => (elm as HTMLElement).click());
      logger.log(`clicked ${selector}`);

      return { success: true, selector: selector };
    }
    catch (e) {
      return { success: false, selector: selector, message: (e as Error).message };
    }
  }

  async _click(selector: string): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("click");
    logger.log(`Trying to click ${selector}`);
    try {
      const elmResult = await Retry.retryUntil(async () => await this.$(selector), (result) => result.success);
      if (!elmResult.success || !elmResult.result) {
        return { success: true, selector: selector, message: "Element not found" };
      }
      logger.log(`click ${selector}`);
      await elmResult.result.click();
      logger.log(`clicked ${selector}`);
      return { success: true, selector: selector };
    }
    catch (e) {
      return { success: false, selector: selector, message: (e as Error).message };
    }
  }

  async type(selector: string, text: string): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("type");
    try {
      await this.page.waitForSelector(selector);
      await this.page.type(selector, text);

      return { success: true, selector: selector };
    }
    catch (e) {
      return { success: false, selector: selector, message: (e as Error).message };
    }
  }

  async getTextContent(selector: string): Promise<BrowserActionResult<string>> {
    const logger = this.logger.createLoggerWithTag("getTextContent");
    logger.log(selector);

    try {
      const textContent = await this.page.$eval(selector, elm => elm.textContent);
      if (textContent === null) {
        return { success: false, selector: selector, message: "Element not found" };
      }
      else {
        return { success: true, result: textContent };
      }
    }
    catch (e) {
      return { success: false, selector: selector, message: (e as Error).message };
    }
  }

  async $(selector: string): Promise<BrowserActionResult<puppeteer.ElementHandle<Element>>> {
    const logger = this.logger.createLoggerWithTag("$");
    logger.log(selector);

    const element = await this.page.$(selector);
    if (element === null) {
      return { success: false, selector: selector, message: "Element not found" };
    }
    else {
      return { success: true, result: element };
    }
  }

  async $$(selector: string): Promise<BrowserActionResult<puppeteer.ElementHandle<Element>[]>> {
    const logger = this.logger.createLoggerWithTag("$$");
    logger.log(selector);

    const element = await this.page.$$(selector);
    if (element === null) {
      return { success: false, selector: selector, message: "Element not found" };
    }
    else {
      return { success: true, result: element };
    }
  }

  async waitForSelector(selector: string): Promise<string> {
    const logger = this.logger.createLoggerWithTag("waitForSelector");
    logger.log(selector);
    await this.page.waitForSelector(selector);
    return Promise.resolve(selector);
  }

  async waitForNetworkIdle(): Promise<void> {
    const logger = this.logger.createLoggerWithTag("waitForNetworkIdle");
    logger.log("waitForNetworkIdle");
    await this.page.waitForNetworkIdle();
  }

  async postScreenshot() {
    const page = await this.page;
    this.logger.log("postScreenshot");
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await this.logger.uploadImage(screenshotBuffer);
  }

  async postDump() {
    const page = await this.page;
    this.logger.log("postDump");
    const filename = `dump-${formatISO(new Date())}.html`;
    const dump = await page.content();
    await this.logger.uploadFile({ file: Buffer.from(dump), filename: filename, type: "html" });
  }

  async bringToFront() {
    const page = await this.page;
    this.logger.log("bringToFront");
    await page.bringToFront();
  }
}
