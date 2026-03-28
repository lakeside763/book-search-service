# Design answers (javascript-code-test)

Answers to the questions from the [JavaScript code test](https://github.com/edfenergy-stevebowerman/javascript-code-test).

---

## 1. How could you easily add other book seller APIs in the future?

**Provider interface + dependency injection.** All book sources implement the same `BookProvider` contract:

```ts
// src/core/book-provider.ts
export interface BookProvider {
  readonly name: string;
  search(query: BookSearchQuery): Promise<Book[]>;
}
```

To add a new API (e.g. Amazon, Waterstones):

1. **Implement `BookProvider`** – one class that calls the API and returns `Book[]`.
2. **Add a mapper** – turn that API’s response shape into the shared `Book` type.
3. **Register the provider** – pass it into `BookSearchService` as primary or fallback. No changes to `BookSearchService` or `example-client.js`.

`example-client.js` only depends on `BookSearchService` and the public API; it never imports provider-specific code. Adding a new provider is a new module that implements the interface and is wired in where the service is constructed.

---

## 2. How would you manage differences in response payloads between different APIs without needing to make future changes to example-client.js?

**Normalise at the edge with mappers.** Each provider has its own response type and a **mapper** that converts it into the single internal `Book` type:

| API           | Response shape              | Mapper                      | Output   |
|---------------|-----------------------------|-----------------------------|----------|
| Google Books  | `items[].volumeInfo`, etc.  | `mapGoogleBooksResponse()`  | `Book[]` |
| Open Library  | `docs[]`, `author_name`, …  | `mapOpenLibraryResponse()` | `Book[]` |

- **`Book`** (in `src/core/book.model.ts`) is the only book shape that the rest of the app (and `example-client.js`) sees.
- **Provider-specific types** (e.g. `GoogleBooksResponse`, `OpenLibraryResponse`) and mapping logic live inside each provider folder. Different field names, nesting, or missing fields are handled there (e.g. `author_name` → `authors`, `first_publish_year` → `yearPublished`, safe defaults for missing data).
- **`example-client.js`** only ever receives `Book[]` from `bookSearchService.search()`. It doesn’t need to change when a new API is added or when an existing API changes its payload, as long as the provider still maps to `Book`.

---

## 3. How would you implement different query types (e.g. by publisher, by year published)?

**Single query model, validated once.** Search criteria are defined in one place:

```ts
// src/core/book-search-query.model.ts
export type BookSearchQuery = {
  title?: string;
  author?: string;
  publisher?: string;
  yearPublished?: number;
  isbn?: string;
};
```

- **Validation** – `query-validator.ts` checks that at least one field is present and that values are valid (e.g. non-empty strings, sensible year, ISBN format). All query types are validated in one place before any provider is called.
- **Usage** – Callers (including `example-client.js`) pass a single object, e.g. `{ title: "Clean Code", author: "Robert C. Martin" }` or `{ publisher: "O'Reilly", yearPublished: 2020 }`.
- **Per-provider translation** – Each provider’s `buildUrl()` (or equivalent) maps `BookSearchQuery` into that API’s parameters (e.g. Google’s `intitle:`, `inpublisher:`, Open Library’s `first_publish_year`). Adding a new query field means: (1) add it to `BookSearchQuery`, (2) add validation if needed, (3) implement it in each provider’s URL/request builder. `example-client.js` stays the same: it just passes the query object.

So different “query types” (by publisher, year, etc.) are just different combinations of fields on the same `BookSearchQuery` type, with validation and provider-specific translation behind the service.

---

## 4. How would your code be tested?

**Layers to test:**

1. **Query validation** – Unit tests for `validateBookSearchQuery()`: valid queries pass, invalid ones (empty, bad year, bad ISBN) throw `ValidationError` with the right message. Pure function, no I/O.

2. **Mappers** – Unit tests for each mapper with fixed API-shaped JSON: assert the returned `Book[]` has correct `id`, `title`, `authors`, `publisher`, `yearPublished`, `isbn`, `source`, and that missing/optional fields are turned into sensible defaults (e.g. empty string, 0). No HTTP.

3. **BookSearchService** – Test with **mocked `BookProvider`s**:
   - Primary returns results → service returns those (and deduplication can be tested with multiple providers).
   - Primary fails or returns empty → fallback is called; test failover and that the last error is thrown when all fail.
   - All return empty → service returns `[]`.

4. **Integration (optional)** – Few tests against real APIs or recorded responses to catch mapping/URL regressions; can be slow and flaky, so kept minimal.

**Why this is testable:** `BookProvider` is a small interface, so providers are easy to mock. The service doesn’t know about Google or Open Library response shapes; it only sees `Book[]`. Validation and mappers are pure and take plain data, so they’re easy to unit test. `example-client.js` is a thin script that composes the service and providers; the behaviour under test lives in the service, validation, and mappers.
