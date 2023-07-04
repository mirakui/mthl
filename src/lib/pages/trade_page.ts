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
    const selector = "#chart-container[class*=chart_loaded]:not([class*=chart_loadingOption])"
    try {
      await this.browser.waitForSelector(selector);
    }
    catch (err) {
      return { success: false, selector: selector, message: (err as Error).message };
    }

    logger.log("End");
    return result;
  }

  async setTradeAmount(amount: number): Promise<BrowserActionResult<void>> {
    const logger = this.logger.createLoggerWithTag("setPrice");
    logger.log(`Start: ${amount}`);

    const amountBeforeResult = await Retry.retryUntil(async () => await this.browser.getTextContent("#tradeAmountTextField"), (result) => result.success);

    if (!amountBeforeResult.success || !amountBeforeResult.result) {
      return { success: false, selector: amountBeforeResult.selector, message: amountBeforeResult.message };
    }

    const amountBeforeStr = amountBeforeResult.result;
    const amountBefore = parseInt(amountBeforeStr.replace(/[^0-9]/g, ""));

    logger.log(`amountBefore: ${amountBeforeStr} (${amountBefore})`);

    if (amountBefore === amount) {
      logger.log("End");
      return { success: true };
    }

    await this.browser.click("#tradeAmountTextField");

    await Retry.retryUntil(async () => await this.browser.$("#numpadKeyConfirm"), (result) => result.success);

    const amountStr = Math.floor(amount).toString();

    for (let i = 0; i < amountStr.length; i++) {
      const numpadKey = `#numpadKey${amountStr[i]}`;
      await this.browser.click(numpadKey);
      await Retry.delay(10);
    }

    await this.browser.click("#numpadKeyConfirm");
    await Retry.delay(10);
    const amountAfterResult = await this.browser.getTextContent("#tradeAmountTextField");

    if (!amountAfterResult.success || !amountAfterResult.result) {
      return { success: false, selector: amountAfterResult.selector, message: amountAfterResult.message };
    }
    const amountAfterStr = amountAfterResult.result;
    const amountAfter = this.parseAmount(amountAfterStr);

    if (amountBefore === amountAfter) {
      logger.log(`Amount not updated: ${amountBeforeStr} -> ${amountAfterStr}`);
      logger.log("End");

      return { success: false, message: `Amount not updated: ${amountBeforeStr} -> ${amountAfterStr}` };
    }
    else {
      logger.log(`Amount updated: ${amountBeforeStr} -> ${amountAfterStr}`);
      logger.log("End");

      return { success: true };
    }
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

  // "¥10,000" -> "10000
  private parseAmount(amountStr: string): number {
    return parseInt(amountStr.replace(/[^0-9]/g, ""));
  }
}
