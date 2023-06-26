import * as puppeteer from 'puppeteer';
import { Mthl } from './mthl';
import { Browser, BrowserActionResult } from './browser';
import { BrowserConfigParams } from './config';
import { Credential, SecretFile } from './secret_file';
import { MultiLogger } from './multi_logger';
import { Retry } from './retry';

const HIGHLOW_URL_BASE = 'https://highlow.com';
const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';
const USER_AGENT = "Mozilla/5.0 (Linux; Android 9; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36";
const VIEWPORT = { width: 390, height: 844 };
const CREDENTIAL_SECRET_FILE_PATH = "config/.secret.json";

interface AssetOption {
  symbol: string | null;
  durationText: string | null;
  id: number | null;
}

type AssetGroups = { [symbol: string]: AssetOption[] };

export class HighLowControllerError extends Error { }

type HighLowControllerProps = {
  browser: Browser;
}

export class HighLowController {
  browser: Browser;
  logger: MultiLogger;

  constructor(props: HighLowControllerProps) {
    this.browser = props.browser;
    this.logger = Mthl.logger.createLoggerWithTag("HighLowController");
  }

  static async init(browserConfigParams: BrowserConfigParams) {
    const browser = new Browser(browserConfigParams);
    await browser.open();
    await browser.page.setUserAgent(USER_AGENT);
    await browser.page.setViewport(VIEWPORT);
    await browser.page.setRequestInterception(true);

    const controller = new HighLowController({ browser });

    browser.page.on("request", request => request.continue());
    browser.page.on("response", controller.onBrowserResponse.bind(controller));

    return controller;
  }

  onBrowserResponse(response: puppeteer.HTTPResponse) {
    const logger = this.logger.createLoggerWithTag("onBrowserResponse");
    if (response.request().resourceType() !== "xhr") {
      return;
    }
    if (!response.url().match(/\/Buy|\/GetTraderBalance/)) {
      return;
    }
    const url = response.url();
    if (url.match(/\/Buy/)) {
      logger.log(`Caught ${url}`);
      response.json().then(responseJson => {
        const postData = response.request().postData();
        logger.log(`/Buy postData: ${postData}`);
        logger.log(`/Buy response: ${JSON.stringify(responseJson)}`);
      }).catch(err => {
        logger.log(`json error on ${url}: ${err}`);
      });
    }
    else if (url.match(/\/GetTraderBalance/)) {
      response.json().then(responseJson => {
        // logger.log(`/GetTraderBalance response: ${JSON.stringify(responseJson)}`);
      }).catch(err => {
        logger.log(`json error on ${url}: ${err}`);
      });
    }
  }

  async loginIfNeeded() {
    const logger = this.logger.createLoggerWithTag("loginIfNeeded");
    const loginUrl = `${HIGHLOW_APP_URL_BASE}/login`;
    const cred = this.loadCredential(CREDENTIAL_SECRET_FILE_PATH);

    await this.browser.goto(loginUrl);
    await this.browser.waitForNetworkIdle();

    logger.log(`url: ${this.browser.page.url()}`);
    if (this.browser.page.url() === loginUrl) {
      logger.log(`Trying to login as ${cred.username}`);
      await this.browser.type("input#username", cred.username);
      await this.browser.type("input#password", cred.password);
      await this.browser.click("div#pwa-login");

      await Retry.retryUntil(async () => this.browser.page.url(), (url) => url !== loginUrl);
      logger.log("Logged in");
    }
    else {
      logger.log("Already logged in");
    }
    logger.log("End");
  }

  async getAssetGroups(): Promise<BrowserActionResult<AssetGroups>> {
    const logger = this.logger.createLoggerWithTag("getAssetGroups");
    logger.log("Start");

    const clickResult = await this.browser.click("div#highlow");
    logger.log(`clickResult: ${JSON.stringify(clickResult)}`);
    if (!clickResult.success) {
      return { success: false, selector: clickResult.selector, message: clickResult.message };
    }

    const assetGroupsResult = await Retry.retryUntil<BrowserActionResult<AssetGroups>>(async () => this.parseAssetGroups(), (assetGroupsResult) => {
      logger.log(`assetGroupsResult: ${JSON.stringify(assetGroupsResult)}`);
      const assetGroups = assetGroupsResult.result;
      if (!assetGroupsResult.success || !assetGroups) {
        return false;
      }
      if (!assetGroups["USD/JPY"] || assetGroups["USD/JPY"].length === 0) {
        return false;
      }
      const assetOption = assetGroups["USD/JPY"][0];
      console.log("assetOption", assetOption);
      if (!assetOption?.durationText || !assetOption.durationText.match(/^15[m分]/)) {
        return false;
      }

      return true;
    });

    return assetGroupsResult;
  }

  async parseAssetGroups(): Promise<BrowserActionResult<AssetGroups>> {
    const logger = this.logger.createLoggerWithTag("parseAssetGroups");

    const assetCardsResult = await this.browser.$$("div[class^=AssetGroup_assetCard__]");
    const assetCards = assetCardsResult.result;
    if (!assetCardsResult.success || !assetCards) {
      return { success: false, selector: assetCardsResult.selector, message: assetCardsResult.message };
    }

    logger.log(`assetCards: ${assetCards.length}`);

    const promises = assetCards.map(async assetCard => {
      const symbol = await assetCard.$eval("div[class^=assetInfo_symbol__]", elm => elm.textContent);

      if (!symbol) { return; }

      const optionCards = await assetCard.$$("div[class^=Carousel_rotateContent__]");

      const promises = optionCards.map(async optionCard => {
        try {
          const durationText = await optionCard.$eval("div[class^=optionCard_duration__]", elm => elm.textContent);
          const id = await optionCard.$eval("div[class*=optionCard_optionCardWrapper]", elm => elm.id);
          const assetOption = { symbol, durationText, id: parseInt(id) };
          return assetOption;
        } catch (e) {
          return Promise.reject(e);
        }
      });

      const assetOptions = await Promise.all(promises);

      return { symbol, group: assetOptions.filter(assetOption => assetOption !== undefined) };
    });

    const assetGroups: AssetGroups = {};
    (await Promise.all(promises)).forEach((arg) => {
      if (!arg) { return; }
      const { symbol, group } = arg;
      if (!symbol || !group) { return; }
      assetGroups[symbol as string] = group as AssetOption[];
    });

    return { success: true, result: assetGroups };
  }

  async getAssetOption(symbol: string, durationText: string): Promise<BrowserActionResult<AssetOption>> {
    const logger = this.logger.createLoggerWithTag("getAssetOption");
    logger.log(`Start: ${symbol}, ${durationText}`);

    const assetGroupsResult = await this.getAssetGroups();
    if (!assetGroupsResult.success) {
      return { success: false, selector: assetGroupsResult.selector, message: assetGroupsResult.message };
    }

    const assetGroups = assetGroupsResult?.result ?? {};
    const assetGroup = assetGroups[symbol];

    if (!assetGroup) {
      return { success: false, message: `No asset group for ${symbol}` };
    }

    logger.log(`finding ${durationText} from assetGroups: ${JSON.stringify(assetGroups)}`)
    const assetOption = assetGroup.find(assetOption => assetOption.durationText === durationText);

    if (!assetOption) {
      return { success: false, message: `No asset option for ${symbol} ${durationText}` };
    }

    return { success: true, result: assetOption };
  }

  async setTradeAmount(price: number): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("setPrice");
    logger.log(`Start: ${price}`);

    const priceBeforeResult = await Retry.retryUntil(async () => await this.browser.getTextContent("#tradeAmountTextField"), (result) => result.success);

    if (!priceBeforeResult.success) {
      return { success: false, selector: priceBeforeResult.selector, message: priceBeforeResult.message };
    }

    const priceBefore = priceBeforeResult.result;
    await this.browser.click("#tradeAmountTextField");

    await Retry.retryUntil(async () => await this.browser.$("#numpadKeyConfirm"), (result) => result.success);

    const priceStr = Math.floor(price).toString();

    for (let i = 0; i < priceStr.length; i++) {
      const numpadKey = `#numpadKey${priceStr[i]}`;
      await this.browser.click(numpadKey);
      await Retry.delay(10);
    }

    await this.browser.click("#numpadKeyConfirm");
    await Retry.delay(10);
    const priceAfterResult = await this.browser.getTextContent("#tradeAmountTextField");
    const priceAfter = priceAfterResult.result;

    if (!priceAfterResult.success) {
      return { success: false, selector: priceAfterResult.selector, message: priceAfterResult.message };
    }

    logger.log(`Price: ${priceBefore} -> ${priceAfter}`);
    logger.log("End");

    return { success: true };
  }

  async entry(order: "high" | "low"): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("entry");
    logger.log("Start");

    const orderButton = order === "high" ? "#placeHighTrade" : "#placeLowTrade";
    await Retry.retryUntil(async () => await this.browser.$(orderButton), (result) => result.success);
    const clickResult = await this.browser.click(orderButton);

    logger.log("End");

    return clickResult;
  }

  async enableOneClickTrading(): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("enableOneClickTrading");
    logger.log("Start");

    await Retry.retryUntil(async () => await this.browser.$("#oneClickTradeToggle"), (result) => result.success);

    const oneClickTradeToggleEnabled0 = (await this.browser.$("#oneClickTradeToggle[class*=oneClickTradeToggle_enabled]"))?.result;
    logger.log(`oneClickTradeToggleEnabled: ${!!oneClickTradeToggleEnabled0}`);

    if (!oneClickTradeToggleEnabled0) {
      await this.browser.click("#oneClickTradeToggle");
      const oneClickTradeToggleEnabled1 = (await this.browser.$("#oneClickTradeToggle[class*=oneClickTradeToggle_enabled]"))?.result;
      logger.log(`-> oneClickTradeToggleEnabled: ${!!oneClickTradeToggleEnabled1}`);

      if (oneClickTradeToggleEnabled1) {
        return { success: true, message: "Enabled one click trading" };
      }
      else {
        return { success: false, message: "Failed to enable one click trading" };
      }
    }

    return { success: true, message: "Already enabled one click trading" };
  }

  async gotoDashboard(): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("gotoDashboard");
    logger.log("Start");

    const dashboardUrl = `${HIGHLOW_APP_URL_BASE}/trade`;
    if (this.browser.page.url() !== dashboardUrl) {
      const result = await this.browser.goto(dashboardUrl);
      return result;
    }
    else {
      return { success: true, message: "Already on dashboard" };
    }
  }

  async gotoTradePage(assetOption: AssetOption): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("gotoTradePage");
    logger.log(`Start: ${JSON.stringify(assetOption)}`)

    const result = await this.browser.goto(`${HIGHLOW_APP_URL_BASE}/trade/${assetOption.id}`);
    await this.browser.waitForSelector("#chart-container[class*=chart_loaded]:not([class*=chart_loadingOption])");

    logger.log("End");
    return result;
  }

  async postScreenshot(): Promise<void> {
    return await this.browser.postScreenshot();
  }

  async postDump(): Promise<void> {
    return await this.browser.postDump();
  }

  async bringToFront(): Promise<void> {
    return await this.browser.bringToFront();
  }

  async fetchBalance(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  private loadCredential(path: string): Credential {
    const logger = this.logger.createLoggerWithTag("loadCredential");
    logger.log(`Start: ${path}`);
    const secretFile = new SecretFile(path);
    if (!secretFile.fileExists()) {
      secretFile.askAndRenewFile();
    }
    logger.log("End");
    return secretFile.readDecrypted();
  }
}
