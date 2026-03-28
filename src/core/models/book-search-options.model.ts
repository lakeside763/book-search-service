import { BookProvider } from "../book-provider";
import { AggregationStrategy } from "./aggregation-strategy";
import { SearchCache } from "./search-result.model";

export type BookSearchServiceOptions = {
  // v1 backward compatibility
  primaryProvider: BookProvider;
  fallbackProviders: BookProvider[];

  // v2 style
  providers?: BookProvider[];
  strategy?: AggregationStrategy;
  
  cache?: SearchCache;
  cacheTtlMs?: number;
  maxResults?: number;
}