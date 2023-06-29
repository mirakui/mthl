import { BrowserActionResult } from "../browser";
import { CacheStore } from "../cache_store";
import { Retry } from "../retry";
import { Page, PageConstructorProps } from "./page";

export interface AssetOption {
  symbol: string | null;
  durationText: string | null;
  id: number | null;
}

export type AssetGroups = { [symbol: string]: AssetOption[] };

const ASSET_GROUPS_CACHE_TTL = 60 * 60 * 1000;
const ASSET_GROUPS_CACHE_KEY = "AssetGroups";

export class DashboardPageError extends Error { }

export class DashboardPage extends Page {
  assetGroupsCache: CacheStore<AssetGroups>;

  constructor({ browser, logger }: PageConstructorProps) {
    const _logger = logger.createLoggerWithTag("DashboardPage");
    super({ browser, logger: _logger });

    this.assetGroupsCache = new CacheStore<AssetGroups>({ ttl: ASSET_GROUPS_CACHE_TTL });
  }

  async goto() {
    const logger = this.logger.createLoggerWithTag("goto");
    logger.log("Start");

    const dashboardUrl = this.pathToUrl("/trade");
    if (this.browser.page.url() !== dashboardUrl) {
      const result = await this.browser.goto(dashboardUrl);
      return result;
    }
    else {
      return { success: true, message: "Already on dashboard" };
    }
  }

  private async getAssetGroups(): Promise<AssetGroups> {
    const logger = this.logger.createLoggerWithTag("getAssetGroups");
    logger.log("Start");

    return await this.assetGroupsCache.fetch(ASSET_GROUPS_CACHE_KEY, async () => {
      const result = await this.fetchAssetGroups();
      if (result.success && result.result) {
        return result.result;
      }
      else {
        throw new DashboardPageError(`Failed to fetchAssetGroups: ${JSON.stringify(result)}`);
      }
    });
  }

  private async fetchAssetGroups(): Promise<BrowserActionResult<AssetGroups>> {
    const logger = this.logger.createLoggerWithTag("fetchAssetGroups");
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

  private async parseAssetGroups(): Promise<BrowserActionResult<AssetGroups>> {
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

    try {
      const assetGroups = await this.getAssetGroups();
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
    catch (e) {
      return { success: false, message: (e as Error).message };
    }
  }
}
