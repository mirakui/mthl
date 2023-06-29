import { CacheStore } from "../cache_store";
import { setTimeout } from "timers/promises";

describe('CacheStore', () => {
  const store = new CacheStore<string>({ ttl: 100 });

  test('write and read', async () => {
    store.write("key1", "value1");
    store.write("key2", "value2");

    expect(store.read("key1")).toBe("value1");
    expect(store.isFresh("key1")).toBe(true);

    expect(store.read("key2")).toBe("value2");
    expect(store.isFresh("key2")).toBe(true);

    expect(store.read("key3")).toBe(undefined);
    expect(store.isFresh("key3")).toBe(false);

    await setTimeout(300);

    expect(store.read("key1")).toBe(undefined);
    expect(store.isFresh("key1")).toBe(false);

    expect(store.read("key2")).toBe(undefined);
    expect(store.isFresh("key2")).toBe(false);

    expect(store.read("key3")).toBe(undefined);
    expect(store.isFresh("key3")).toBe(false);
  });

  test('fetch', async () => {
    const fn1 = () => "value1";
    const fn2 = () => "value2";

    expect(store.fetch("key", fn1)).toBe("value1");
    expect(store.fetch("key", fn2)).toBe("value1");

    await setTimeout(300);

    expect(store.fetch("key", fn2)).toBe("value2");
  });

  test('delete', async () => {
    store.write("key1", "value1");
    expect(store.read("key1")).toBe("value1");
    store.delete("key1");
    expect(store.read("key1")).toBe(undefined);
  });
});
