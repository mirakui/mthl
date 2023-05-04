import { scheduleJob } from "node-schedule";
import { MultiLogger } from "./multi_logger";
import { Mthl } from "./mthl";

type Schedule = {
  schedule: string;
  query: object;
}

type ConstructorProps = {
  schedules: Schedule[];
}

export class Cron {
  private schedules: Schedule[];
  private _logger?: MultiLogger;

  constructor(props: ConstructorProps) {
    this.schedules = props.schedules;
  }

  get logger() {
    if (this._logger === undefined) {
      this._logger = Mthl.logger.createLoggerWithTag("Cron");
    }
    return this._logger;
  }

  start() {
    this.logger.log("Start");
    this.setupJobs(this.schedules);
  }

  private setupJobs(schedules: Schedule[]) {
    for (let item of schedules) {
      this.logger.log(`Setting up job: ${JSON.stringify(item)}`);
      scheduleJob(item.schedule, () => {
        Mthl.server.onData(JSON.stringify(item.query));
      });
    }
  }
}
