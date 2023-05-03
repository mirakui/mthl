import { CommandBase, CommandPropsBase, CommandResultBase } from "./commands/base";
import Ajv from 'ajv';
import { Mthl } from "./mthl";
import { EntryCommand, EntryCommandProps } from "./commands/entry_command";
import { EchoCommand, EchoCommandProps } from "./commands/echo_command";
import { StatsCommand, StatsCommandProps } from "./commands/stats_command";

const EntryCommandSchema = {
  type: "object",
  properties: {
    command: {
      type: "string",
      enum: ["Entry"],
    },
    order: {
      type: "string",
      enum: ["high", "low"],
    },
    pairName: {
      type: "string",
    },
  },
  required: ["command", "order", "pairName"],
  additionalProperties: true,
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

const StatsCommandSchema = {
  type: "object",
  properties: {
    command: {
      type: "string",
      enum: ["Stats"],
    },
    clear: {
      type: "boolean",
    },
  },
  required: ["command"],
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
      case "Entry":
        return this.buildEntryCommand(json);
      case "Stats":
        return this.buildStatsCommand(json);
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
      order: json.order as "high" | "low",
      pairName: json.pairName as "USDJPY" | "EURJPY" | "EURUSD",
      timePeriod: json.timePeriod as "5m" | "15m",
    };

    return new EntryCommand(props);
  }

  buildStatsCommand(json: any): StatsCommand {
    const ajv = new Ajv();
    const valid = ajv.validate(StatsCommandSchema, json);
    if (!valid) {
      throw new QueryParserError(`Invalid StatsCommand: ${ajv.errorsText()}`);
    }

    const props: StatsCommandProps = {
      controller: Mthl.controller,
      logger: Mthl.logger,
      clear: json.clear,
    };

    return new StatsCommand(props);
  }
}
