import { Retry, RetryCallback, RetryCallbackMatcher } from '../retry';

interface TestObject {
  status: "OK" | "ERROR";
  retries: number;
}

test('Retry', async () => {
  let i = 0;
  const callback: RetryCallback<TestObject> = async () => {
    i++;
    if (i < 3) {
      return { status: "ERROR", retries: i - 1 };
    }
    else {
      return { status: "OK", retries: i - 1 };
    }
  }
  const matcher: RetryCallbackMatcher<TestObject> = (actual) => {
    return actual.status === "OK";
  }
  const startTime = Date.now();
  const result = await Retry.retryUntil(callback, matcher, { retries: 10, delay: 50 })
  const duration = Date.now() - startTime;
  expect(result.status).toBe("OK");
  expect(result.retries).toBe(2);
  expect(duration).toBeGreaterThanOrEqual(95);
  expect(duration).toBeLessThanOrEqual(105);
});
