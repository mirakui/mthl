import * as net from "node:net";
import schedule from "node-schedule";
import { formatISO } from "date-fns";
import { Config } from "./lib/config";

const config = Config.load();
const pipePath = `\\\\.\\pipe\\${config.server.pipeName}`;

function log(message: string) {
  const time = formatISO(new Date());
  console.log(`${time} ${message}`);
}

function sendCommand(command: object) {
  const json = JSON.stringify(command);

  const client = net.createConnection(pipePath, () => {
    client.write(json);
    log(`Sending: ${json}`);
    client.end();
  });
}

function start() {
  log("Start");

  schedule.scheduleJob("0 10 * * * 1-5", () => {
    sendCommand({ command: "CheckBalance" });
  });

  schedule.scheduleJob("0 30 6,11,18 * * 1-5", () => {
    sendCommand({ command: "Stats" });
  });
}

start();
