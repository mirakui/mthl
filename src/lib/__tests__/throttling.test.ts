import { Throttling } from "../throttling";
import { setTimeout } from "timers/promises";

test('Throttling', async () => {
  const throttling = new Throttling<void>(2, 500);

  let runCount = 0;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
      runCount++;
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(runCount).toBe(2);
  expect(successCount).toBe(2);
  expect(errorCount).toBe(8);

  await setTimeout(1000);

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
      runCount++;
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(runCount).toBe(4);
  expect(successCount).toBe(4);
  expect(errorCount).toBe(16);
});

test('Throttling with errors', async () => {
  const throttling = new Throttling<void>(2, 500);

  let runCount = 0;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
      if (i <= 3) {
        throw new Error("error");
      }
      runCount++;
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(runCount).toBe(2);
  expect(successCount).toBe(2);
  expect(errorCount).toBe(8);

  await setTimeout(1000);

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
      if (i <= 3) {
        throw new Error("error");
      }
      runCount++;
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(runCount).toBe(4);
  expect(successCount).toBe(4);
  expect(errorCount).toBe(16);
});
