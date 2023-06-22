export class RetryTimeoutError extends Error {
}

export interface RetryOptions {
  retries?: number;
  delay?: number;
}

export type RetryCallback<T> = () => Promise<T>;
export type RetryCallbackMatcher<T> = (actual: T) => Boolean;

const DEFAULT_RETRIES = 20;
const DEFAULT_DELAY = 1000;

export class Retry {
  static defaultRetries: number = DEFAULT_RETRIES;
  static defaultDelay: number = DEFAULT_DELAY;

  static setDefault(opts: RetryOptions) {
    if (opts.retries) {
      Retry.defaultRetries = opts.retries;
    }
    if (opts.delay) {
      Retry.defaultDelay = opts.delay;
    }
  }

  static async retryUntil<T>(callback: RetryCallback<T>, matcher: RetryCallbackMatcher<T>, opts?: RetryOptions): Promise<T> {
    const retries = opts?.retries || Retry.defaultRetries;
    const delay = opts?.delay || Retry.defaultDelay;
    let lastResult: T | undefined;
    for (let i = 0; i < retries; i++) {
      lastResult = await callback();
      console.log(`Retry ${i}: ${JSON.stringify(lastResult)}`);
      if (matcher(lastResult)) {
        return lastResult;
      }
      else {
        await this.delay(delay);
      }
    }
    throw new RetryTimeoutError(`Retry timeout after ${retries} retries. Last result: ${lastResult}`);
  }

  static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
