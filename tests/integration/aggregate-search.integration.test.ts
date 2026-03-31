import { describe, expect, it } from "vitest";
import { BookSearchService } from "../../src/core/book-search.service";
import { FetchHttpClient } from "../../src/core/http-client";
import { GoogleBooksProvider } from "../../src/providers/google/google-books.provider";
import { OpenLibraryProvider } from "../../src/providers/openlibrary/open-library.provider";

const skipLive = process.env.SKIP_LIVE_INTEGRATION === "1" || process.env.CI === "true";

describe.skipIf(skipLive)("aggregate search (live HTTP)", () => {
  it(
    "aggregates results from Google and Open Library and deduplicates entries that share the same ISBN",
    async () => {
      const googleClient = new FetchHttpClient({
        baseUrl: "https://www.googleapis.com/books/v1",
        timeoutMs: 15_000,
      });
      const openLibraryClient = new FetchHttpClient({
        baseUrl: "https://openlibrary.org",
        timeoutMs: 15_000,
      });

      const googleProvider = new GoogleBooksProvider(
        googleClient,
        20,
        process.env.GOOGLE_BOOKS_API_KEY,
      );
      const openLibraryProvider = new OpenLibraryProvider(openLibraryClient, 20);

      const service = new BookSearchService({
        primaryProvider: googleProvider,
        fallbackProviders: [openLibraryProvider],
        strategy: "aggregate",
        maxResults: 20,
      });

      const result = await service.searchDetailed({
        isbn: "9780132350884",
      });

      expect(result.meta.strategy).toBe("aggregate");
      expect(result.meta.providersQueried).toEqual(
        expect.arrayContaining(["google-books", "open-library"]),
      );

      const withIsbn = result.books.filter((b) => b.isbn?.replace(/[-\s]/g, "") === "9780132350884");
      const uniqueSources = new Set(withIsbn.map((b) => b.source));
      expect(result.books.length).toBeGreaterThan(0);
      // After dedupe, at most one row per ISBN key from the merged list
      if (withIsbn.length > 0) {
        expect(withIsbn.length).toBe(1);
      }
      expect(uniqueSources.size).toBeLessThanOrEqual(1);
    },
    45_000,
  );
});
