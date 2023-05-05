import Ajv from "ajv";
import { Mthl } from "../mthl";
import { HighLowController } from "../highlow_controller";
import { MultiLogger } from "../multi_logger";

export interface CommandPropsBase {
  controller: HighLowController
  logger: MultiLogger
  silent?: boolean
}

export interface CommandResultBase {
  success: boolean;
  error?: any
}

export interface CommandSchema {
  properties?: object,
  required?: string[],
}

export class CommandValidationError extends Error { }

export class CommandBuilderBase<PropsType extends CommandPropsBase> {
  readonly schema: any;
  readonly json: any;

  constructor(schema: CommandSchema, json: any) {
    this.json = json;
    this.schema = this.convertSchema(json.command, schema);
  }

  buildProps(): PropsType {
    const ajv = new Ajv();
    const valid = ajv.validate(this.schema, this.json);
    if (!valid) {
      throw new CommandValidationError(`Invalid Command: ${ajv.errorsText()}`);
    }

    let props: CommandPropsBase = {
      ...(this.json),
      controller: Mthl.controller,
      logger: Mthl.logger,
    };

    return props as PropsType;
  }

  build(): CommandBase<CommandPropsBase, CommandResultBase> {
    throw new Error("Not implemented");
  }

  convertSchema(commandName: string, schema: CommandSchema): object {
    const schemaProperties = schema.properties || {};
    const schemaRequired = schema.required || [];

    return {
      type: "object",
      properties: {
        command: {
          type: "string",
          enum: [this.json.command],
        },
        ...schemaProperties,
      },
      required: schemaRequired.concat(["command"]),
      additionalProperties: false,
    }
  }
}

export class CommandBase<PropsType extends CommandPropsBase, ResultType extends CommandResultBase> {
  private readonly _props: PropsType;
  readonly name: string = "Unknown";
  static readonly schema = {};

  constructor(props: PropsType) {
    this._props = props;
  }

  get props() {
    return this._props;
  }

  get logger() {
    return this.props.logger;
  }

  get controller() {
    return this.props.controller;
  }

  async run(): Promise<ResultType> {
    throw new Error("Not implemented");
  }
}
