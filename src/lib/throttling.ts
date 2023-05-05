export class RateLimitExceededError extends Error { }

type ThrottlingFunction<T> = () => Promise<T>;

export class Throttling<T> {
  private max: number;
  private interval: number;
  private runCount: number;
  private startTime?: number;

  constructor(max: number, interval: number) {
    this.runCount = 0;
    this.max = max;
    this.interval = interval;
  }

  async throttle(fn: ThrottlingFunction<T>): Promise<T> {
    const now = new Date().getTime();
    if (this.startTime === undefined) {
      this.startTime = now;
    }

    const elapsed = now - this.startTime;
    // console.log("elapsed", elapsed, "interval", this.interval);
    if (elapsed < this.interval) {
      if (this.runCount >= this.max) {
        return Promise.reject(new RateLimitExceededError(`Max ${this.runCount} calls / ${this.interval} ms`));
      }
    } else {
      this.runCount = 0;
      this.startTime = now;
    }

    this.runCount++;

    return Promise.resolve(fn());
  }
}
