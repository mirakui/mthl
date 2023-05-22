import { CommandBase, CommandBuilderBase, CommandPropsBase, CommandResultBase } from "./commands/base";
import { EntryCommandBuilder } from "./commands/entry_command";
import { EchoCommandBuilder } from "./commands/echo_command";
import { StatsCommandBuilder } from "./commands/stats_command";
import { CheckBalanceCommandBuilder } from "./commands/check_balance_command";
import { WarmupCommandBuilder } from "./commands/warmup_command";
import { ScreenshotCommandBuilder } from "./commands/screenshot_command";
import { DumpCommandBuilder } from "./commands/dump_command";

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

    const builder = this.createBuilder(json);
    return builder.build();
  }

  createBuilder(json: any): CommandBuilderBase<CommandPropsBase> {
    switch (json.command) {
      case "Echo":
        return new EchoCommandBuilder(json);
      case "Entry":
        return new EntryCommandBuilder(json);
      case "Stats":
        return new StatsCommandBuilder(json);
      case "CheckBalance":
        return new CheckBalanceCommandBuilder(json);
      case "Warmup":
        return new WarmupCommandBuilder(json);
      case "Screenshot":
        return new ScreenshotCommandBuilder(json);
      case "Dump":
        return new DumpCommandBuilder(json);
      default:
        throw new QueryParserError(`Command not supported: "${json.command}"`);
    }
  }
}
