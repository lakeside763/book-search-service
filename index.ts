export { BookSearchService } from "./src/core/book-search.service";

export type { Book } from "./src/core/book.model";
export type { BookSearchQuery } from "./src/core/book-search-query.model";
export type { BookProvider } from "./src/core/book-provider";

export { AppError, ValidationError, ProviderError } from "./src/core/errors";
export { FetchHttpClient } from "./src/core/http-client";

export { GoogleBooksProvider } from "./src/providers/google/google-books.provider";
export { OpenLibraryProvider } from "./src/providers/openlibrary/open-library.provider";