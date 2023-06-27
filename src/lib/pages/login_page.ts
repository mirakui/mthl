import { Retry } from "../retry";
import { SecretFile, Credential } from "../secret_file";
import { Page, PageConstructorProps } from "./page";

const CREDENTIAL_SECRET_FILE_PATH = "config/.secret.json";

export class LoginPage extends Page {
  constructor({ browser, logger }: PageConstructorProps) {
    const _logger = logger.createLoggerWithTag("LoginPage");
    super({ browser, logger: _logger });
  }

  async loginIfNeeded() {
    const logger = this.logger.createLoggerWithTag("loginIfNeeded");
    const loginUrl = this.pathToUrl("/login");
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
