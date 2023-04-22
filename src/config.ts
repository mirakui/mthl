import * as dotenv from 'dotenv';

export class Config {
  static load() {
    dotenv.config();
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
