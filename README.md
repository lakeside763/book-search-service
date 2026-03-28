# Book Search Service

A small library that searches books via multiple providers (Google Books, Open Library) through a single interface. Uses a primary provider with optional fallbacks.

**Things you will be asked about** (adding providers, handling different API payloads, query types, testing): see [DESIGN.md](./DESIGN.md).

## Setup

- **Node.js** 18+
- **pnpm**

```bash
pnpm install
```

Copy `.env.example` to `.env` and set `GOOGLE_BOOKS_API_KEY` if you hit Google Books rate limits (429). The example client loads `.env` via [dotenv](https://github.com/motdotla/dotenv).

## Usage

```javascript
import {
  BookSearchService,
  FetchHttpClient,
  GoogleBooksProvider,
  OpenLibraryProvider,
} from "./index";

const bookSearchService = new BookSearchService({
  primaryProvider: new GoogleBooksProvider(
    new FetchHttpClient({ baseUrl: "https://www.googleapis.com/books/v1", timeoutMs: 5000 }),
    10,
    process.env.GOOGLE_BOOKS_API_KEY,
  ),
  fallbackProviders: [
    new OpenLibraryProvider(
      new FetchHttpClient({ baseUrl: "https://openlibrary.org", timeoutMs: 5000 }),
      10,
    ),
  ],
});

const books = await bookSearchService.search({
  title: "Clean Code",
  author: "Robert C. Martin",
});
```

Run the example:

```bash
pnpm start
```

## Project structure

```
core/
  book.model.ts           # Book type
  book-search-query.model.ts
  book-search.service.ts  # Orchestrates search, primary + fallbacks
  book-provider.ts        # Provider interface
  query-validator.ts
  errors.ts
  http-client.ts

providers/
  google/   google-books.provider.ts, google-books.mapper.ts
  openlibrary/   open-library.provider.ts, open-library.mapper.ts

index.ts                  # Public API
example-client.js
```

Import only from `index.ts`; do not rely on internal paths.

## How search works

1. The **primary provider** is called first.
2. If it returns results, those are returned (after deduplication).
3. If it fails or returns no results, **fallback providers** are tried in order.
4. If all fail, the last error is thrown; if all return empty, an empty array is returned.

## Adding a provider

1. Implement the `BookProvider` interface (`name`, `search(query)`).
2. Use the shared `HttpClient` (or your own) to call the external API.
3. Map the API response to the `Book` type (e.g. in a mapper).
4. Register the provider as primary or in `fallbackProviders` when building `BookSearchService`.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `pnpm start`   | Run example client |
| `pnpm run typecheck` | Type-check with `tsc --noEmit` |
