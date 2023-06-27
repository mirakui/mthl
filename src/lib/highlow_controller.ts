import * as puppeteer from 'puppeteer';
import { Mthl } from './mthl';
import { Browser, BrowserActionResult } from './browser';
import { BrowserConfigParams } from './config';
import { MultiLogger } from './multi_logger';
import { Retry } from './retry';
import { AssetOption, DashboardPage } from './pages/dashboard_page';
import { LoginPage } from './pages/login_page';
import { TradePage } from './pages/trade_page';
import { PageConstructorProps } from './pages/page';

const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';
const USER_AGENT = "Mozilla/5.0 (Linux; Android 9; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36";
const VIEWPORT = { width: 390, height: 844 };

export class HighLowControllerError extends Error { }

type HighLowControllerProps = {
  browser: Browser;
}

export class HighLowController {
  browser: Browser;
  logger: MultiLogger;
  loggedIn: boolean = false;
  balance?: number;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  tradePage: TradePage;

  constructor(props: HighLowControllerProps) {
    this.browser = props.browser;
    this.logger = Mthl.logger.createLoggerWithTag("HighLowController");

    const pageProps: PageConstructorProps = { browser: this.browser, logger: this.logger };
    this.loginPage = new LoginPage(pageProps);
    this.dashboardPage = new DashboardPage(pageProps);
    this.tradePage = new TradePage(pageProps);
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
    if (response.status() !== 200) {
      return;
    }
    const url = response.url();
    if (url.match(/\/Buy/)) {
      this.notifyBuyResponse(response);
    }
    else if (url.match(/\/GetTraderBalance/)) {
      response.json().then(responseJson => {
        /*
        {"data":{"balanceInformation":{"BonusInfo":null,"Cashback":null,"balance":25250,"bonusBalance":0},"retentionInformation":{"errors":[],"status":"success","campaignName":"STA","data":[{"Key":"MaxPayout","Value":"0"},{"Key":"STACount","Value":"0"},{"Key":"CampaignReason","Value":"Cashback"},{"Key":"PendingCashback","Value":"0"},{"Key":"PendingCashbackMonthly","Value":"0"},{"Key":"ReleasedJackpotCashback","Value":"0"},{"Key":"ReleasedJackpotID","Value":""}]}},"status":"success","timestamp":"2023-06-26T04:04:22Z"}
        */
        // logger.log(`/GetTraderBalance response: ${JSON.stringify(responseJson)}`);
        const balance = responseJson?.data?.balanceInformation.balance;
        if (balance) {
          this.updateBalance(balance);
        }
      }).catch(err => {
        logger.log(`json error on ${url}: ${err}`);
      });
    }
    else if (url.match(/\/GetTraderParams/)) {
      /*
      {"data":{"AccountType":0,"CurrencyCode":"JPY","CurrencyID":392,"CustomVariables":[],"Email":"q@d.cc","FirstName":"q","IsSuspended":false,"LanguageID":1041,"LastName":"d","LotSize":"10000","MaxDeposit":9999999,"MaxInvestment":200000,"MaxLotsInvestment":15,"MaxWithdraw":9999999,"MinDeposit":1000,"MinInvestment":1000,"MinLotsInvestment":1,"MinWithdraw":1,"OperatorID":1,"PurchaseInvestmentDefaultValue":1000,"PurchaseInvestmentDefaultValueLots":100,"PurchaseSliderInterval":100,"PurchaseSliderIntervalLots":10,"PurchaseSliderMaxValue":50000,"PurchaseSliderMaxValueLots":1000,"PurchaseSliderMinValue":1000,"PurchaseSliderMinValueLots":0,"PurchaseSuggestedAmounts":"5000, 10000, 50000","PurchaseSuggestedAmountsLots":""},"status":"success","timestamp":"2023-06-27T10:06:18Z"}
      */
      this.updateTraderParams(response);
    }
  }

  async loginIfNeeded(): Promise<void> {
    const logger = this.logger.createLoggerWithTag("loginIfNeeded");
    logger.log("Start");
    if (this.loggedIn) {
      logger.log("Already logged in");
      return;
    }
    else {
      return await this.loginPage.loginIfNeeded();
    }
  }

  async gotoDashboard(): Promise<DashboardPage> {
    const logger = this.logger.createLoggerWithTag("gotoDashboard");
    logger.log("Start");

    const result = await this.dashboardPage.goto();

    logger.log("End");
    if (result.success) {
      return this.dashboardPage;
    }
    else {
      throw new HighLowControllerError(`Failed to gotoDashboard: ${JSON.stringify(result)}`);
    }
  }

  async gotoTradePage(assetOption: AssetOption): Promise<TradePage> {
    const logger = this.logger.createLoggerWithTag("gotoTradePage");
    logger.log(`Start: ${JSON.stringify(assetOption)}`)

    const result = await this.tradePage.goto(assetOption);
    await this.browser.waitForSelector("#chart-container[class*=chart_loaded]:not([class*=chart_loadingOption])");

    logger.log("End");
    if (result.success) {
      return this.tradePage;
    }
    else {
      throw new HighLowControllerError(`Failed to gotoTradePage: ${JSON.stringify(result)}`);
    }
  }

  async warmup(): Promise<BrowserActionResult<AssetOption>> {
    const logger = this.logger.createLoggerWithTag("warmup");
    logger.log("Start");

    await this.loginIfNeeded();
    const dashboardPage = await this.gotoDashboard();
    const result = await dashboardPage.getAssetOption("USD/JPY", "15分");

    if (result.success) {
      logger.postMessage(":rocket: *Warm up succeeded*");
    }
    else {
      logger.postMessage(`:warning: *Warm up failed*\n\`\`\`\n${JSON.stringify(result)}\n\`\`\``);
    }
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

  updateBalance(balance: number): void {
    const logger = this.logger.createLoggerWithTag("updateBalance");
    const balanceBefore = this.balance;

    if (balanceBefore === balance) {
      return;
    }
    this.balance = balance;

    const balanceStr = this.formatPrice(balance);
    if (balanceBefore === undefined) {
      logger.postMessage(`:moneybag: *Current Balance *\n${balanceStr}\n`);
      return;
    }

    logger.log(`Balance updated: ${balanceBefore} -> ${balance}`);

    const diff = balance - balanceBefore;
    const diffStr = this.formatPrice(diff, true);
    let emoji = diff >= 0 ? ":moneybag:" : ":money_with_wings:";

    logger.postMessage(`${emoji} *Balance updated*\n${balanceStr} (${diffStr})\n`);
  }

  notifyBuyResponse(response: puppeteer.HTTPResponse) {
    const logger = this.logger.createLoggerWithTag("notifyBuyResponse");
    const url = response.url();
    logger.log(`Start: ${url}`);

    response.json().then(responseJson => {
      const postData = response.request().postData();
      const msg = `Responded BUY request\n\`\`\`\n${postData}\n\`\`\`\nResponse\n\`\`\`\n${JSON.stringify(responseJson)}\`\`\``;
      logger.postMessage(msg);
      logger.log("End");
    }).catch(err => {
      logger.log(`json error on ${url}: ${err}`);
    });
  }

  updateTraderParams(response: puppeteer.HTTPResponse) {
    const logger = this.logger.createLoggerWithTag("updateTraderParams");
    const url = response.url();
    logger.log(`Start: ${url}`);

    response.json().then(responseJson => {
      const customVariables = responseJson?.data?.CustomVariables;
      logger.log(`responseJson: ${JSON.stringify(responseJson)}`);
      const loggedIn = !!(customVariables ?? customVariables.length > 0);
      if (loggedIn !== this.loggedIn) {
        logger.postMessage(`:key: *Updated login status* \`${this.loggedIn}\` -> \`${loggedIn}\``)
        this.loggedIn = loggedIn;
      }
      logger.log("End");
    }).catch(err => {
      logger.log(`json error on ${url}: ${err}`);
    });
  }

  private formatPrice(num: number, plus?: boolean): string {
    const sign = num >= 0 ? (plus ? "+" : "") : "-";
    const abs = Math.abs(num).toLocaleString("en-US");
    return `${sign}¥${abs}`;
  }
}
