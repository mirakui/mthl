import { Browser, BrowserActionResult } from "./lib/browser";
import { Retry } from "./lib/retry";
import { SecretFile } from "./lib/secret_file";

async function setupBrowser() {
  const browser = new Browser({
    timeout: 20000,
    host: "127.0.0.1",
    port: 9222,
    launch: true,
    headless: true,
  });

  await browser.open();
  await browser.page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1");
  await browser.page.setViewport({ width: 390, height: 844 });
  await browser.page.setRequestInterception(true);

  return browser;
}

interface AssetOption {
  symbol: string | null;
  durationText: string | null;
  id: number | null;
}

type AssetGroups = { [symbol: string]: AssetOption[] };

async function setPrice(browser: Browser, price: number): Promise<BrowserActionResult<void>> {
  const priceBeforeResult = await Retry.retryUntil(async () => await browser.getTextContent("#tradeAmountTextField"), (result) => result.success);

  if (!priceBeforeResult.success) {
    return { success: false, selector: priceBeforeResult.selector, message: priceBeforeResult.message };
  }

  const priceBefore = priceBeforeResult.result;
  await browser.click("#tradeAmountTextField");

  await Retry.retryUntil(async () => await browser.$("#numpadKeyConfirm"), (result) => result.success);

  const priceStr = Math.floor(price).toString();
  // for (let i = priceStr.length - 1; 0 <= i; i--) {
  for (let i = 0; i < priceStr.length; i++) {
    const numpadKey = `#numpadKey${priceStr[i]}`;
    await browser.click(numpadKey);
    await Retry.delay(10);
  }

  await browser.click("#numpadKeyConfirm");
  await Retry.delay(10);
  const priceAfterResult = await browser.getTextContent("#tradeAmountTextField");
  const priceAfter = priceAfterResult.result;

  if (!priceAfterResult.success) {
    return { success: false, selector: priceAfterResult.selector, message: priceAfterResult.message };
  }

  console.log(`Price: ${priceBefore} -> ${priceAfter}`);

  return { success: true };
}

async function getAssetGroups(browser: Browser): Promise<BrowserActionResult<AssetGroups>> {
  await browser.goto("https://app.highlow.com/trade");

  const clickResult = await browser.click("div#highlow");
  console.log("clickResult", clickResult);
  if (!clickResult.success) {
    return { success: false, selector: clickResult.selector, message: clickResult.message };
  }

  const assetGroupsResult = await Retry.retryUntil<BrowserActionResult<AssetGroups>>(async () => await parseAssetGroups(browser), (assetGroupsResult) => {
    console.log("assetGroupsResult", assetGroupsResult)
    const assetGroups = assetGroupsResult.result;
    if (!assetGroupsResult.success || !assetGroups) {
      return false;
    }
    if (!assetGroups["USD/JPY"] || assetGroups["USD/JPY"].length === 0) {
      return false;
    }
    const assetOption = assetGroups["USD/JPY"][0];
    console.log("assetOption", assetOption);
    if (!assetOption?.durationText || !assetOption.durationText.match(/^15/)) {
      return false;
    }

    return true;
  });

  return assetGroupsResult;
}

async function parseAssetGroups(browser: Browser): Promise<BrowserActionResult<AssetGroups>> {
  const assetCardsResult = await browser.$$("div[class^=AssetGroup_assetCard__]");
  const assetCards = assetCardsResult.result;
  if (!assetCardsResult.success || !assetCards) {
    return { success: false, selector: assetCardsResult.selector, message: assetCardsResult.message };
  }

  console.log("assetCards", assetCards.length);

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
        console.log(e);
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

async function login(browser: Browser, username: string, password: string) {
  const page = browser.page;

  await browser.goto("https://app.highlow.com/login");
  await browser.waitForNetworkIdle();

  if (page.url() === "https://app.highlow.com/login") {
    await browser.type("input#username", username);
    await browser.type("input#password", password);
    await browser.click("div#pwa-login");
    await browser.waitForNetworkIdle();
    console.log("logged in");
  }
  else {
    console.log("Already logged in");
  }
}

(async () => {
  const secretFile = new SecretFile("config/.secret.json");
  if (!secretFile.fileExists()) {
    secretFile.askAndRenewFile();
  }
  const secretData = secretFile.readDecrypted();

  const browser = await setupBrowser();
  const page = browser.page;

  page.on("request", request => {
    request.continue();
  });

  page.on("response", response => {
    if (response.request().resourceType() !== "xhr") {
      return;
    }
    if (response.url().match(/\/Buy/)) {
      response.json().then(json => {
        console.log("/Buy postData", response.request().postData());
        console.log("/Buy response", json);
      });
    }
    // else if (
    //   false
    //   || response.url() === "https://platformapi.highlow.com/Client.svc/GetTraderParams"
    //   || response.url() === "https://platformapi.highlow.com/Client.svc/GetTraderBalance"
    //   // || response.url().match(/\/pwa-maintenance.json/)
    //   // || response.url().match(/\/app-version\.json/)
    //   // || response.url().match(/\/get-one-click-trade-preference/)
    // ) {
    //   response.json().then(json => {
    //     console.log(response.request().resourceType(), response.url(), json);
    //   });
    // }
  });

  console.log("login");
  await login(browser, secretData.username, secretData.password);
  console.log("getAssetGroups");

  const getAssetGroupsResult = await getAssetGroups(browser)
  console.log("getAssetGroupsResult", getAssetGroupsResult);
  const assetGroups = getAssetGroupsResult.result;
  if (!getAssetGroupsResult.success || !assetGroups) {
    console.log("getAssetGroups failed", getAssetGroupsResult);
    return;
  }

  const assetOption = assetGroups["USD/JPY"][0];

  const url = `https://app.highlow.com/trade/${assetOption.id}`
  console.log("url", url);
  await browser.goto(url);

  console.log("waitFor...");
  // await page.waitForSelector("#oneClickTradeToggle", { visible: true });
  // await Retry.retryUntil(async () => await browser.$("#trade[class*=trade_loaded]"), (result) => result.success);
  await browser.page.waitForSelector("#chart-container[class*=chart_loaded]:not([class*=chart_loadingOption])");
  console.log("waitFor... end");

  // await Retry.delay(10000);

  await setPrice(browser, 1000);

  await Retry.retryUntil(async () => await browser.$("#oneClickTradeToggle"), (result) => result.success);

  const oneClickTradeToggleEnabled = (await browser.$("#oneClickTradeToggle[class*=oneClickTradeToggle_enabled]"))?.result;
  console.log("oneClickTradeToggleEnabled", !!oneClickTradeToggleEnabled);
  if (!oneClickTradeToggleEnabled) {
    console.log("enabling")
    await browser.click("#oneClickTradeToggle");
  }

  console.log("placeHighTrade")
  await Retry.retryUntil(async () => await browser.$("#placeHighTrade"), (result) => result.success);
  const clickResult = await Retry.retryUntil(async () => await browser.click("#placeHighTrade"), (result) => result.success);

  console.log("placeHighTrade: ", clickResult);

})();
