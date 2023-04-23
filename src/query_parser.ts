import { CommandBase, CommandPropsBase, CommandResultBase } from "./commands/base";
import Ajv from 'ajv';
import { EntryCommand, EntryCommandProps } from "./commands/entry_command";
import { Mthl } from "./mthl";
import { EchoCommand, EchoCommandProps } from "./commands/echo_command";

const EntryCommandSchema = {
  type: "object",
  properties: {
    command: {
      type: "string",
      enum: ["Entry"],
    },
    direction: {
      type: "string",
      enum: ["up", "down"],
    },
    pairName: {
      type: "string",
    },
  },
  required: ["command", "direction", "pairName"],
  additionalProperties: false,
};

const EchoCommandSchema = {
  type: "object",
  properties: {
    command: {
      type: "string",
      enum: ["Echo"],
    },
    message: {
      type: "string",
    },
  },
  required: ["command", "message"],
  additionalProperties: false,
}

export class QueryParserError extends Error { }

export class QueryParser {
  constructor() {

  }

  parse(query: string): CommandBase<CommandPropsBase, CommandResultBase> {
    let json;
    try {
      json = JSON.parse(query);
    }
    catch (err) {
      throw new QueryParserError(`Invalid Query: ${query}`);
    }

    switch (json.command) {
      case "Echo":
        return this.buildEchoCommand(json);
        break;
      case "Entry":
        return this.buildEntryCommand(json);
        break;
      default:
        throw new QueryParserError(`Command not supported: "${json.command}" in ${query}`);
    }
  }

  buildEchoCommand(json: any): EchoCommand {
    const ajv = new Ajv();
    const valid = ajv.validate(EchoCommandSchema, json);
    if (!valid) {
      throw new QueryParserError(`Invalid EchoCommand: ${ajv.errorsText()}`);
    }

    const props: EchoCommandProps = {
      controller: Mthl.controller,
      logger: Mthl.logger,
      message: json.message,
    };

    return new EchoCommand(props);
  }

  buildEntryCommand(json: any): EntryCommand {
    const ajv = new Ajv();
    const valid = ajv.validate(EntryCommandSchema, json);
    if (!valid) {
      throw new QueryParserError(`Invalid EntryCommand: ${ajv.errorsText()}`);
    }

    const props: EntryCommandProps = {
      controller: Mthl.controller,
      logger: Mthl.logger,
      direction: json.direction as "up" | "down",
      pairName: json.pairName as "USDJPY" | "EURJPY" | "EURUSD",
      timePeriod: json.timePeriod as "5m" | "15m",
      // timeRange: json.timeRange,
      // expectedPrice: json.expectedPrice,
      // requestedAt: json.requestedAt,
      // receivedAt: json.receivedAt,
    };

    return new EntryCommand(props);
  }
}
