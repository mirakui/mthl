import { Browser } from "../browser";
import { MultiLogger } from "../multi_logger";

const HIGHLOW_APP_URL_BASE = 'https://app.highlow.com';

export type PageConstructorProps = {
  browser: Browser;
  logger: MultiLogger;
}

export class Page {
  browser: Browser;
  logger: MultiLogger;

  constructor({ browser, logger }: PageConstructorProps) {
    this.browser = browser;
    this.logger = logger;
  }

  pathToUrl(path: string): string {
    return `${HIGHLOW_APP_URL_BASE}${path}`;
  }
}
