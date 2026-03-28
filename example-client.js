import "dotenv/config";

import {
  BookSearchService,
  FetchHttpClient,
  GoogleBooksProvider,
  OpenLibraryProvider,
  MemoryCache,
} from "./index";

async function main() {
  const googleBooksHttpClient = new FetchHttpClient({
    baseUrl: "https://www.googleapis.com/books/v1",
    timeoutMs: 5000,
  });

  const openLibraryHttpClient = new FetchHttpClient({
    baseUrl: "https://openlibrary.org",
    timeoutMs: 5000,
  });

  /** Per-request page size for each API; service caps merged/deduped results to the same value. */
  const pageSize = 10;

  const googleProvider = new GoogleBooksProvider(
    googleBooksHttpClient,
    pageSize,
    process.env.GOOGLE_BOOKS_API_KEY,
  );
  const openLibraryProvider = new OpenLibraryProvider(openLibraryHttpClient, pageSize);

  const bookSearchService = new BookSearchService({
    primaryProvider: googleProvider,
    fallbackProviders: [openLibraryProvider],
    strategy: 'aggregate',
    maxResults: pageSize,

    // optional cache
    cache: new MemoryCache(),
    cacheTtlMs: 60000,
  });

  const query = { author: "Robert C. Martin" };

  const books = await bookSearchService.search(query);
  console.log(JSON.stringify(books, null, 2));
}

main().catch((error) => {
  console.error("Book search failed:", error);
  process.exit(1);
});