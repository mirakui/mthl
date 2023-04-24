import * as net from "node:net";
import { Mthl } from "./mthl";
import { QueryParser } from "./query_parser";

type ConstructorProps = {
  pipeName: string;
}

export class Server {
  private _server?: net.Server;
  private readonly _pipePath: string;
  private readonly _queryParser: QueryParser;

  constructor(props: ConstructorProps) {
    if (!props.pipeName.match(/^[a-zA-Z0-9_]+$/)) {
      throw new Error(`Invalid pipe name: ${props.pipeName}`);
    }
    this._pipePath = `\\\\.\\pipe\\${props.pipeName}`;
    this._queryParser = new QueryParser();
  }

  get logger() {
    return Mthl.logger;
  }

  start() {
    this._server = net.createServer(undefined, (socket: net.Socket) => {
      this.logger.log("Client connected");

      socket.on("data", (data: any) => {
        try {
          this.logger.log(`Received from client: ${data}`);
          const cmd = this._queryParser.parse(data);
          Mthl.processor.addCommand(cmd);
        }
        catch (err) {
          this.logger.log(`Error on receiving command: \`${data}\`, ${err}`);
        }
      });

      socket.on("end", () => {
        this.logger.log("Client disconnected");
      });
    });

    this._server.on("error", (err: any) => {
      this.logger.log(`Server error: ${err}`);
    });

    this._server.listen(this._pipePath, () => {
      this.logger.log(`Listening: ${this._pipePath}`);
    });
  }
}
