import * as dotenv from 'dotenv';
import fs from 'fs';
import Ajv from 'ajv';

type ConfigParams = {
  account: "production" | "demo";
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

(async () => {

  const data = fs.readFileSync('config/config.json', 'utf8');
  console.log(data);
  let obj = JSON.parse(data);
  const ajv = new Ajv();
  if (!ajv.validate(ConfigParamsSchema, obj)) {
    console.error(ajv.errors);
  }

  console.log(obj);

})();
