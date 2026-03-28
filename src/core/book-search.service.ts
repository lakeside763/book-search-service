import { BookProvider } from "./book-provider";
import { DeduplicationService } from "./deduplication.service";
import { SearchError } from "./errors";
import { BookSearchServiceOptions } from "./models/book-search-options.model";
import { BookSearchQuery } from "./models/book-search-query.model";
import { Book } from "./models/book.model";
import { SearchCache, SearchMeta, SearchResult } from "./models/search-result.model";
import { validateBookSearchQuery } from "./query-validator";

function normalizeQueryValue(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildCacheKey(query: BookSearchQuery, strategy: 'failover' | 'aggregate'): string {
  return JSON.stringify({
    strategy,
    title: normalizeQueryValue(query.title),
    author: normalizeQueryValue(query.author),
    publisher: normalizeQueryValue(query.publisher),
    yearPublished: query.yearPublished,
    isbn: normalizeQueryValue(query.isbn),
  });
}

export class BookSearchService {
  private readonly strategy: 'failover' | 'aggregate';
  private readonly maxResults: number;
  private readonly cacheTtlMs: number;
  private readonly cache?: SearchCache;
  private readonly deduplicationService = new DeduplicationService();
  

  constructor(private readonly options: BookSearchServiceOptions) {
    this.strategy = options.strategy ?? 'failover';
    this.maxResults = options.maxResults ?? 10;
    this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
    this.cache = options.cache;
  }

  async search(query: BookSearchQuery): Promise<Book[]> {
    const result = await this.searchDetailed(query);
    return result.books;
  }

  async searchDetailed(query: BookSearchQuery): Promise<SearchResult> {
    validateBookSearchQuery(query);

    const cacheKey = buildCacheKey(query, this.strategy);
    const cached = await this.cache?.get(cacheKey);

    if (cached) {
      console.log('cache hit', cacheKey);
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true,
        }
      }
    }

    try {
      const result = 
        this.strategy === 'aggregate'
          ? await this.searchWithAggregation(query)
          : await this.searchWithFailover(query);
        
      await this.cache?.set(cacheKey, result, this.cacheTtlMs);
      return result;
    } catch (error) {
      throw new SearchError("Failed to search books", error);
    }
  }

  private getProvidersForFailover(): BookProvider[] {
    const providers: BookProvider[] = [];

    if (this.options.primaryProvider) {
      providers.push(this.options.primaryProvider);
    }

    if (this.options.fallbackProviders?.length) {
      providers.push(...this.options.fallbackProviders);
    }
    
    return providers;
  }

  private getProvidersForAggregation(): BookProvider[] {
    if (this.options.providers?.length) {
      return this.options.providers;
    }

    return this.getProvidersForFailover();
  }

  private buildMeta(meta: SearchMeta): SearchMeta {
    return meta
  }

  private async searchWithFailover(query: BookSearchQuery): Promise<SearchResult> {
    const providers = this.getProvidersForFailover();
    const providersQueried = providers.map((provider: BookProvider) => provider.name)
    const providersSucceeded: string[] = [];
    const providersFailed: string[] = [];

    for (const provider of providers) {
      try {
        const books = await provider.search(query);
        providersSucceeded.push(provider.name);

        if (books.length > 0) {
          const deduped = this.deduplicationService
            .deduplicate(books)
            .slice(0, this.maxResults);

          return {
            books: deduped,
            meta: this.buildMeta({
              strategy: 'failover',
              cacheHit: false,
              providersQueried,
              providersSucceeded,
              providersFailed,
            })
          }
        }
      } catch (error) {
        providersFailed.push(provider.name)
      }
    }

    return {
      books: [],
      meta: this.buildMeta({
        strategy: 'failover',
        cacheHit: false,
        providersQueried,
        providersSucceeded,
        providersFailed,
      })
    }
  }

  private async searchWithAggregation(query: BookSearchQuery): Promise<SearchResult> {
    const providers = this.getProvidersForAggregation();
    const providersQueried = providers.map((provider: BookProvider) => provider.name);

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const books = await provider.search(query);
          return {
            provider: provider.name,
            ok: true as const,
            books,
          };
        } catch (error) {
          return {
            provider: provider.name,
            ok: false as const,
            books: [] as Book[],
          };
        }
      })
    );

    const providersSucceeded = results
      .filter((result) => result.ok)
      .map((result) => result.provider);

    const providersFailed = results
      .filter((result) => !result.ok)
      .map((result) => result.provider);

    const allBooks = results.flatMap((result) => result.books);

    const dedupedBooks = this.deduplicationService
      .deduplicate(allBooks)
      .slice(0, this.maxResults);

    return {
      books: dedupedBooks,
      meta: this.buildMeta({
        strategy: 'aggregate',
        cacheHit: false,
        providersQueried,
        providersSucceeded,
        providersFailed,
      }),
    };
  };
 }



