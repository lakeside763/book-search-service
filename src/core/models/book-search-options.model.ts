import { BookProvider } from "../book-provider";
import { AggregationStrategy } from "./aggregation-strategy";
import { SearchCache } from "./search-result.model";

export type BookSearchServiceOptions = {
  primaryProvider: BookProvider;
  fallbackProviders: BookProvider[];

  providers?: BookProvider[];
  strategy?: AggregationStrategy;
  
  cache?: SearchCache;
  cacheTtlMs?: number;
  maxResults?: number;
}