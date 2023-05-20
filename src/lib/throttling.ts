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
    if (elapsed < this.interval) {
      if (this.runCount >= this.max) {
        throw new RateLimitExceededError(`Max ${this.runCount} calls / ${this.interval / 1000} sec`);
      }
    } else {
      this.runCount = 0;
      this.startTime = now;
    }

    this.runCount++;
    try {
      return await fn();
    } catch (e) {
      this.runCount--;
      throw e;
    }
  }

  status(): string {
    if (this.startTime === undefined) {
      return "not started";
    }

    const now = new Date().getTime();
    const elapsed = now - this.startTime;
    const remaining = Math.floor((this.interval - elapsed) / 1000.0);
    return `${this.runCount} / ${this.max} (${remaining} sec remaining)`;
  }
}
