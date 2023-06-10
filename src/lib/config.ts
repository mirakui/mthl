export interface ConfigParams {
  account: AccountConfigParams;
  slack: SlackConfigParams;
  server: ServerConfigParams;
  browser: BrowserConfigParams
  cron: CronConfigParams;
  entry: EntryConfigParams;
}

export interface AccountConfigParams {
  environment: "production" | "demo";
}

export interface SlackConfigParams {
  accessToken: string;
  appToken: string;
  channel: string;
}

export interface ServerConfigParams {
  pipeName: string;
}

export interface CronConfigParams {
  schedules: {
    schedule: string;
    query: object;
  }[];
}

export interface EntryConfigParams {
  rateLimitPerMinute: number;
}

export interface BrowserConfigParams {
  timeout: number;
  host: string;
  port: number;
  launch: boolean;
  headless: boolean;
}

const ConfigParamsSchema = {
  type: "object",
  properties: {
    account: {
      type: "string",
      enum: ["production", "demo"],
    }
  },
  additionalProperties: false,
};

export class Config {
  static load(): ConfigParams {
    const configParams: ConfigParams = require('../../config/config.cjs');
    return configParams;
  }

  static getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      else {
        throw new Error(`Environment variable ${key} is not set`);
      }
    }
    return value;
  }
}
