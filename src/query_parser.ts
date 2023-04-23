import { CommandBase, CommandPropsBase, CommandResultBase } from "./commands/base";
import Ajv from 'ajv';
import { EntryCommand, EntryCommandProps } from "./commands/entry_command";
import { Mthl } from "./mthl";

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
  requred: ["command", "direction", "pairName"],
  additionalProperties: false,
};

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
      case "Entry":
        return this.buildEntryCommand(json);
        break;
      default:
        throw new QueryParserError(`Command not supported: "${json.command}" in ${query}`);
    }
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
