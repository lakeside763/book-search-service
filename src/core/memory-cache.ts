import { SearchCache, SearchResult } from "./models/search-result.model"

type CacheEntry = {
  value: SearchResult;
  expiresAt: number;
}

export class MemoryCache implements SearchCache {
  private readonly store = new Map<string, CacheEntry>();

  async get(key: string): Promise<SearchResult | null> {
    const entry = this.store.get(key);

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return structuredClone(entry.value);
  }

  async set(key: string, value: SearchResult, ttlMs: number = 60_000): Promise<void> {
    this.store.set(key, {
      value: structuredClone(value),
      expiresAt: Date.now() + ttlMs,
    });
  }
}