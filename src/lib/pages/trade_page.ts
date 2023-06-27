import { BrowserActionResult } from "../browser";
import { Retry } from "../retry";
import { AssetOption } from "./dashboard_page";
import { Page, PageConstructorProps } from "./page";

export class TradePage extends Page {
  constructor({ browser, logger }: PageConstructorProps) {
    const _logger = logger.createLoggerWithTag("TradePage");
    super({ browser, logger: _logger });
  }

  async goto(assetOption: AssetOption): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("gotoTradePage");
    logger.log(`Start: ${JSON.stringify(assetOption)}`)

    const url = this.pathToUrl(`/trade/${assetOption.id}`);
    const result = await this.browser.goto(url);
    await this.browser.waitForSelector("#chart-container[class*=chart_loaded]:not([class*=chart_loadingOption])");

    logger.log("End");
    return result;
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
}
