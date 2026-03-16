import {
  BookSearchService,
  FetchHttpClient,
  GoogleBooksProvider,
  OpenLibraryProvider,
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

  const bookSearchService = new BookSearchService({
    primaryProvider: new GoogleBooksProvider(googleBooksHttpClient),
    fallbackProviders: [new OpenLibraryProvider(openLibraryHttpClient)],
  });

  const books = await bookSearchService.search({
    title: "Clean Code",
    author: "Robert C. Martin",
  });

  console.log(JSON.stringify(books, null, 2));
}

main().catch((error) => {
  console.error("Book search failed:", error);
  process.exit(1);
});