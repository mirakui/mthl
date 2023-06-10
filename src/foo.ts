import { Browser } from "./lib/browser";
import { SecretFile } from "./lib/secret_file";

(async () => {
  const secretFile = new SecretFile("config/.secret.json");
  if (!secretFile.fileExists()) {
    secretFile.askAndRenewFile();
  }
  const secretData = secretFile.readDecrypted();

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

  browser.page.on("request", request => {
    request.continue();
  });

  browser.page.on("response", response => {
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
        console.log(response.request().resourceType(), response.url(), json);
      });
    }
  });

  await browser.goto("https://app.highlow.com/trade");
  await browser.page.waitForNetworkIdle();

  // login
  if (browser.page.url() === "https://app.highlow.com/login") {
    await browser.page.waitForSelector("input#username");
    await browser.page.type("input#username", secretData.username);
    await browser.page.type("input#password", secretData.password);
    await browser.page.click("div#pwa-login");
    await browser.page.waitForNetworkIdle();
  }
})();
