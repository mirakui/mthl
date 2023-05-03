import { CommandBase, CommandPropsBase, CommandResultBase } from "./commands/base";

export class CommandProcessorError extends Error { }

export type CommandProcessorCallback<ResultType> = (result: ResultType) => Promise<void>;
export interface CommandContainer {
  command: CommandBase<CommandPropsBase, CommandResultBase>;
  callback?: CommandProcessorCallback<CommandResultBase>;
}

export class CommandProcessor {
  queue: CommandContainer[];
  isRunning: boolean;

  constructor() {
    this.queue = [];
    this.isRunning = false;
  }

  addCommand(container: CommandContainer) {
    this.queue.push(container);
    if (!this.isRunning) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isRunning = false;
      return;
    }

    this.isRunning = true;
    const commandContainer = this.queue.shift();
    if (commandContainer === undefined) {
      throw new CommandProcessorError("Command is undefined");
    }
    const result = await commandContainer.command.run();
    if (commandContainer.callback !== undefined) {
      await commandContainer.callback(result);
    }

    this.processQueue();
  }
}
