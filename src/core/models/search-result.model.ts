import { AggregationStrategy } from "./aggregation-strategy";
import type { Book } from "./book.model";

export type SearchMeta = {
  strategy: AggregationStrategy;
  cacheHit?: boolean;
  providersQueried: string[];
  providersSucceeded: string[];
  providersFailed: string[];
};

export type SearchResult = {
  books: Book[];
  meta: SearchMeta;
};

export interface SearchCache {
  get(key: string): Promise<SearchResult | null>;
  set(key: string, value: SearchResult, ttlMs: number): Promise<void>;
}