import * as net from "node:net";
import { Mthl } from "./mthl";
import { QueryParser } from "./query_parser";
import { MultiLogger } from "./multi_logger";
import { CommandResultBase } from "./commands/base";

type ConstructorProps = {
  pipeName: string;
}

export class Server {
  private server?: net.Server;
  private readonly pipePath: string;
  private readonly queryParser: QueryParser;
  private _logger?: MultiLogger;

  constructor(props: ConstructorProps) {
    if (!props.pipeName.match(/^[a-zA-Z0-9_]+$/)) {
      throw new Error(`Invalid pipe name: ${props.pipeName}`);
    }
    this.pipePath = `\\\\.\\pipe\\${props.pipeName}`;
    this.queryParser = new QueryParser();
  }

  get logger() {
    if (this._logger === undefined) {
      this._logger = Mthl.logger.createLoggerWithTag("Server");
    }

    return this._logger;
  }

  start() {
    this.server = net.createServer(undefined, (socket: net.Socket) => {
      this.logger.log("Client connected");

      socket.on("data", (_data) => {
        let data = "";
        try {
          data = _data.toString().trim();
          this.logger.log(`Received from client: ${data}`);
          const command = this.queryParser.parse(data);
          const callback = async (result: CommandResultBase) => {
            const mark = result.success ? ":white_check_mark:" : ":x:";
            Mthl.server.logger.postMessage(`${mark}*Finished command*\ncommand\n\`\`\`\n${data}\n\`\`\`\nresult\n\`\`\`\n${JSON.stringify(result)}\n\`\`\``);
          }
          Mthl.processor.addCommand({ command, callback });
        }
        catch (err) {
          this.logger.postMessage(`:x: *Server Error on receiving command*\ncommand\n\`\`\`\n${data}\n\`\`\`\nerror\n\`\`\`\n${err}\n\`\`\``);
        }
      });

      socket.on("end", () => {
        this.logger.log("Client disconnected");
      });
    });

    this.server.on("error", (err: any) => {
      this.logger.log(`Server error: ${err}`);
    });

    this.server.listen(this.pipePath, () => {
      this.logger.log(`Listening: ${this.pipePath}`);
    });
  }
}
