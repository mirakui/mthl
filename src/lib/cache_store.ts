const DEFAULT_TTL = 60 * 1000;

type CacheEntryProps<T> = {
  key: string;
  value: T;
  ttl: number;
}

export class CacheEntry<T> {
  key: string;
  value: T;
  storedAt: Date;
  expiresAt: Date;

  constructor({ key, value, ttl }: CacheEntryProps<T>) {
    const now = this.now();
    this.key = key;
    this.value = value;
    this.storedAt = now;
    this.expiresAt = new Date(Number(now) + ttl);
  }

  expired(): boolean {
    return this.expiresAt < this.now();
  }

  private now() {
    return new Date();
  }
}

type CacheStoreProps = {
  ttl?: number;
}

export class CacheKeyError extends Error { }

export class CacheStore<T> {
  entries: { [key: string]: CacheEntry<T> } = {};
  ttl: number;

  constructor(props: CacheStoreProps) {
    this.ttl = props.ttl || DEFAULT_TTL;
  }

  write(key: string, value: T) {
    this.entries[key] = new CacheEntry({ key, value, ttl: this.ttl });
  }

  read(key: string): T | undefined {
    const entry = this.readEntry(key);
    if (entry === undefined) {
      return undefined;
    }
    else {
      return entry.value;
    }
  }

  isFresh(key: string): boolean {
    return this.readEntry(key) !== undefined;
  }

  delete(key: string): void {
    delete this.entries[key];
  }

  async fetch(key: string, fn: () => Promise<T>): Promise<T> {
    const entry = this.readEntry(key);
    if (entry !== undefined) {
      return entry.value;
    }
    else {
      const value = await fn();
      this.write(key, value);
      return value;
    }
  }

  readEntry(key: string): CacheEntry<T> | undefined {
    const entry = this.entries[key];
    if (entry === undefined) {
      return undefined;
    }
    if (entry.expired()) {
      this.delete(key);
      return undefined;
    }
    return entry;
  }

  private now() {
    return new Date();
  }
}
