import { Throttling } from "../throttling";
import { setTimeout } from "timers/promises";

test('Throttling', async () => {
  const throttling = new Throttling<void>(2, 500);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(successCount).toBe(2);
  expect(errorCount).toBe(8);

  await setTimeout(1000);

  for (let i = 0; i < 10; i++) {
    await throttling.throttle(async () => {
    }).then((x) => {
      return successCount++;
    }).catch((err) => {
      return errorCount++;
    });
  }
  expect(successCount).toBe(4);
  expect(errorCount).toBe(16);
});
