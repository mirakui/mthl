import { CommandBase, CommandPropsBase, CommandResultBase } from "./commands/base";

export class CommandProcessorError extends Error { }

export class CommandProcessor {
  queue: CommandBase<CommandPropsBase, CommandResultBase>[];
  isRunning: boolean;

  constructor() {
    this.queue = [];
    this.isRunning = false;
  }

  addCommand(command: CommandBase<CommandPropsBase, CommandResultBase>) {
    this.queue.push(command);
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
    const command = this.queue.shift();
    if (command === undefined) {
      throw new CommandProcessorError("Command is undefined");
    }
    await command.run();
    this.processQueue();
  }
}
