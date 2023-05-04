export class Statistics {
  private stats: { [key: string]: number } = {};

  increment(key: string) {
    if (!this.stats[key]) {
      this.stats[key] = 0;
    }

    this.stats[key]++;
  }

  toString() {
    const sortedKeys = Object.keys(this.stats).sort();
    let buffer = "";
    for (const key of sortedKeys) {
      const value = this.stats[key];
      buffer += `${key}: ${value}\n`;
    }
    return buffer.trim();
  }

  zerofillAll(keys: string[]) {
    for (const key of keys) {
      if (!this.stats[key]) {
        this.stats[key] = 0;
      }
    }
  }

  clear() {
    this.stats = {};
  }
}
