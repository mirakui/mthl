import * as dotenv from 'dotenv';
import fs from 'fs';
import Ajv from 'ajv';

export type ConfigParams = {
  account: "production" | "demo";
  slack: {
    accessToken: string,
    appToken: string,
    channel: string,
  },
  server: {
    pipeName: string,
  },
  browser: {
    timeout: number,
    host: string,
    port: number,
  },
  cron: {
    schedules: {
      schedule: string,
      query: object,
    }[],
  },
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
