import { Browser } from "./lib/browser";
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
    if (
      response.url() === "https://platformapi.highlow.com/Client.svc/GetTraderParams"
      || response.url() === "https://platformapi.highlow.com/Client.svc/GetTraderBalance"
      || response.url().match(/\/pwa-maintenance.json/)
      || response.url().match(/\/app-version\.json/)
      || response.url().match(/\/get-one-click-trade-preference/)
    ) {
      response.json().then(json => {
        // console.log(response.request().resourceType(), response.url(), json);
      });
    }
  });

  await page.goto("https://app.highlow.com/login");
  await page.waitForNetworkIdle();

  // login
  if (page.url() === "https://app.highlow.com/login") {
    await page.waitForSelector("input#username");
    await page.type("input#username", secretData.username);
    await page.type("input#password", secretData.password);
    await page.click("div#pwa-login");
    await page.waitForNetworkIdle();
  }

  await page.goto("https://app.highlow.com/trade");

  await page.waitForSelector("div#highlow");
  await page.click("div#highlow");

  setInterval((async () => {

    const assetCards = await page.$$("div[class^=AssetGroup_assetCard__]");
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

    const assetGroups: { [symbol: string]: AssetOption[] } = {};
    (await Promise.all(promises)).forEach((arg) => {
      if (!arg) { return; }
      const { symbol, group } = arg;
      if (!symbol || !group) { return; }
      assetGroups[symbol as string] = group as AssetOption[];
    });

    console.log("assetGroups", assetGroups);
  }), 3000);
})();
