# Book Search Service

TypeScript library that searches books through **Google Books** and **Open Library** behind one `BookSearchService`. Supports **failover** (try primary, then fallbacks) or **aggregate** (query all providers and merge/dedupe).

Interview-style design notes: [DESIGN.md](./DESIGN.md).

## Requirements

- Node.js 18+
- pnpm

```bash
pnpm install
```

## Environment

Copy [.env.example](./.env.example) to `.env`. Set `GOOGLE_BOOKS_API_KEY` if you see HTTP 429 from Google ([Books API key](https://developers.google.com/books/docs/v1/using#APIKey)).

The example loads `.env` with [dotenv](https://github.com/motdotla/dotenv) (`import "dotenv/config"`).

## Run the example

```bash
pnpm start
```

Uses **tsx** so TypeScript sources run without a build. Use `pnpm start` rather than `node example-client.js` directly (Node does not execute `index.ts`).

## Usage

```javascript
import "dotenv/config";

import {
  BookSearchService,
  FetchHttpClient,
  GoogleBooksProvider,
  OpenLibraryProvider,
  MemoryCache,
} from "./index";

const pageSize = 10;

const googleProvider = new GoogleBooksProvider(
  new FetchHttpClient({
    baseUrl: "https://www.googleapis.com/books/v1",
    timeoutMs: 5000,
  }),
  pageSize,
  process.env.GOOGLE_BOOKS_API_KEY,
);

const openLibraryProvider = new OpenLibraryProvider(
  new FetchHttpClient({ baseUrl: "https://openlibrary.org", timeoutMs: 5000 }),
  pageSize,
);

const bookSearchService = new BookSearchService({
  primaryProvider: googleProvider,
  fallbackProviders: [openLibraryProvider],
  strategy: "failover", // or "aggregate"
  maxResults: pageSize,

  // Optional: omit `cache` to always hit providers
  // cache: new MemoryCache(),
  // cacheTtlMs: 60_000,
});

const books = await bookSearchService.search({
  title: "Clean Code",
  author: "Robert C. Martin",
});
```

- **`search(query)`** → `Promise<Book[]>` (normalized books only).
- **`searchDetailed(query)`** → `Promise<SearchResult>` with `{ books, meta }` (e.g. `meta.cacheHit`, `providersSucceeded` / `providersFailed`).

### Strategies

| `strategy`   | Behavior |
|-------------|----------|
| `failover` (default) | Primary first; if it errors or returns no books, try each fallback in order. |
| `aggregate` | All listed providers in parallel; combine results, dedupe, then `slice` to `maxResults`. |

### Cache

- Implement `SearchCache` (`get` / `set`) or use **`MemoryCache`** (in-memory, **this process only**).
- If `cache` is omitted, `BookSearchService` skips reads/writes (`this.cache?.get` / `this.cache?.set`).
- Cache keys include query fields, `strategy`, and `maxResults`. A second identical call in the **same** process can set `meta.cacheHit: true` when using `searchDetailed`.

### Provider constructors

- `GoogleBooksProvider(httpClient, maxResults = 10, apiKey?)` — `apiKey` is appended as Google's `key` query param.
- `OpenLibraryProvider(httpClient, limit = 10)` — `limit` is sent to Open Library's search API.

`maxResults` on the service caps the **final** list after dedupe; provider limits control **per-request** API page size (often keep them aligned via one `pageSize` constant).

## Project layout

```
src/core/
  book-search.service.ts
  book-provider.ts
  query-validator.ts
  deduplication.service.ts
  http-client.ts
  errors.ts
  memory-cache.ts
  models/          # Book, queries, options, SearchResult, etc.

src/providers/
  google/
  openlibrary/

index.ts           # public exports
example-client.js
```

Import from **`index.ts`** (or `"./index"` in the repo root); avoid deep imports into `src/`.

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm start` | Run `example-client.js` with tsx |
| `pnpm run typecheck` | `tsc --noEmit` |

## Adding another provider

1. Implement `BookProvider` (`name`, `search(query): Promise<Book[]>`).
2. Map API JSON to the shared `Book` type (mapper next to the provider).
3. Pass the instance as `primaryProvider`, `fallbackProviders`, and/or `providers` (for custom aggregate lists).
