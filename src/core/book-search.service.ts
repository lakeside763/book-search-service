import { BookProvider } from "./book-provider";
import { BookSearchQuery } from "./book-search-query.model";
import { Book } from "./book.model";
import { validateBookSearchQuery } from "./query-validator";

type BookSearchServiceOptions = {
  primaryProvider: BookProvider;
  fallbackProviders: BookProvider[];
}

export class BookSearchService {
  private readonly primaryProvider: BookProvider;
  private readonly fallbackProviders: BookProvider[];

  constructor(options: BookSearchServiceOptions) {
    this.primaryProvider = options.primaryProvider;
    this.fallbackProviders = options.fallbackProviders ?? [];
  }

  async search(query: BookSearchQuery): Promise<Book[]> {
    validateBookSearchQuery(query);

    const providers = [this.primaryProvider, ...this.fallbackProviders];
    let lastError: unknown;

    for (const provider of providers) {
      try {
        const results = await provider.search(query);

        if (results.length > 0) {
          return deduplicateBooks(results)
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return [];
  }
}

function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Map<string, Book>();

  for (const book of books) {
    const key = createBookKey(book);

    if (!seen.has(key)) {
      seen.set(key, book);
    }
  }
  return Array.from(seen.values());
}

function createBookKey(book: Book):string {
  if (book.isbn) {
    return `isbn:${book.isbn.toLowerCase()}`;
  }

  const title = book.title.trim().toLowerCase();
  const authors = book.authors
    .map((author) => author.trim().toLowerCase())
    .sort()
    .join(",");

  return `${title}|authors:${authors}`;
}