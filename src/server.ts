import * as net from "node:net";
import { Mthl } from "./mthl";

type ConstructorProps = {
  pipeName: string;
}

export class Server {
  private _server?: net.Server;
  private readonly _pipePath: string;

  constructor(props: ConstructorProps) {
    if (!props.pipeName.match(/\A[a-zA-Z0-9_]+\z/)) {
      throw new Error(`Invalid pipe name: ${props.pipeName}`);
    }
    this._pipePath = `\\\\.\\pipe\\${props.pipeName}`;
  }

  get logger() {
    return Mthl.logger;
  }

  start() {
    this._server = net.createServer(undefined, (socket: net.Socket) => {
      this.logger.log("Client connected");

      socket.on("data", (data: any) => {
        this.logger.log(`Received from client: ${data}`);
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
