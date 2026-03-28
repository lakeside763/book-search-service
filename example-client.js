import {
  BookSearchService,
  FetchHttpClient,
  GoogleBooksProvider,
  OpenLibraryProvider,
  InMemoryCache,
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

  const googleProvider = new GoogleBooksProvider(googleBooksHttpClient);
  const openLibraryProvider = new OpenLibraryProvider(openLibraryHttpClient);

  //  v1
  const bookSearchService = new BookSearchService({
    primaryProvider: googleProvider,
    fallbackProviders: [openLibraryProvider],
  });

  // v2
  const bookSearchServiceV2 = new BookSearchService({
    primaryProvider: googleProvider,
    fallbackProviders: [openLibraryProvider],
    strategy: 'aggregate',
    maxResults: 10,

    // optional cache
    cache: new InMemoryCache(),
    cacheTtlMs: 60000,
  });

  const books = await bookSearchServiceV2.search({
    title: "Clean Code",
    author: "Robert C. Martin",
  });

  console.log(JSON.stringify(books, null, 2));
}

main().catch((error) => {
  console.error("Book search failed:", error);
  process.exit(1);
});