import { describe, expect, it, vi } from "vitest";
import { BookSearchService } from "../../../src/core/book-search.service";
import type { BookProvider } from "../../../src/core/book-provider";
import type { Book } from "../../../src/core/models/book.model";
import { ValidationError } from "../../../src/core/errors";
import { MemoryCache } from "../../../src/core/memory-cache";

const sampleBook = (overrides: Partial<Book> = {}): Book => ({
  id: "test-1",
  title: "Test Book",
  authors: ["A. Author"],
  source: "test",
  ...overrides,
});

describe("BookSearchService", () => {
  it("validates the query before searching (throws ValidationError)", async () => {
    const primary: BookProvider = {
      name: "primary",
      search: vi.fn().mockResolvedValue([sampleBook()]),
    };
    const service = new BookSearchService({
      primaryProvider: primary,
      fallbackProviders: [],
    });

    await expect(service.searchDetailed({})).rejects.toThrow(ValidationError);
    expect(primary.search).not.toHaveBeenCalled();
  });

  it("tries the primary provider first and returns its books when non-empty", async () => {
    const primary: BookProvider = {
      name: "primary",
      search: vi.fn().mockResolvedValue([sampleBook({ id: "p1" })]),
    };
    const fallback: BookProvider = {
      name: "fallback",
      search: vi.fn().mockResolvedValue([sampleBook({ id: "f1" })]),
    };
    const service = new BookSearchService({
      primaryProvider: primary,
      fallbackProviders: [fallback],
      maxResults: 10,
    });

    const result = await service.searchDetailed({ title: "x" });

    expect(primary.search).toHaveBeenCalledOnce();
    expect(fallback.search).not.toHaveBeenCalled();
    expect(result.books).toHaveLength(1);
    expect(result.books[0].id).toBe("p1");
    expect(result.meta.strategy).toBe("failover");
  });

  it("tries fallback providers when primary fails", async () => {
    const primary: BookProvider = {
      name: "primary",
      search: vi.fn().mockRejectedValue(new Error("network")),
    };
    const fallback: BookProvider = {
      name: "fallback",
      search: vi.fn().mockResolvedValue([sampleBook({ id: "f1" })]),
    };
    const service = new BookSearchService({
      primaryProvider: primary,
      fallbackProviders: [fallback],
    });

    const result = await service.searchDetailed({ title: "x" });

    expect(primary.search).toHaveBeenCalledOnce();
    expect(fallback.search).toHaveBeenCalledOnce();
    expect(result.books[0].id).toBe("f1");
    expect(result.meta.providersFailed).toContain("primary");
    expect(result.meta.providersSucceeded).toContain("fallback");
  });

  it("queries all providers in parallel when strategy is aggregate", async () => {
    const order: string[] = [];
    const providerA: BookProvider = {
      name: "a",
      search: vi.fn(async () => {
        order.push("a-start");
        await new Promise((r) => setTimeout(r, 40));
        order.push("a-end");
        return [sampleBook({ id: "a1", source: "a", title: "Book A" })];
      }),
    };
    const providerB: BookProvider = {
      name: "b",
      search: vi.fn(async () => {
        order.push("b-start");
        await new Promise((r) => setTimeout(r, 40));
        order.push("b-end");
        return [sampleBook({ id: "b1", source: "b", title: "Book B" })];
      }),
    };

    const service = new BookSearchService({
      primaryProvider: providerA,
      fallbackProviders: [providerB],
      strategy: "aggregate",
      maxResults: 10,
    });

    const result = await service.searchDetailed({ title: "parallel" });

    expect(providerA.search).toHaveBeenCalledOnce();
    expect(providerB.search).toHaveBeenCalledOnce();
    expect(result.meta.strategy).toBe("aggregate");
    expect(result.books.length).toBeGreaterThanOrEqual(2);
    // If serial, "b-start" would come after "a-end". Parallel overlaps both searches.
    expect(order.indexOf("b-start")).toBeLessThan(order.indexOf("a-end"));
  });

  it("deduplicates by ISBN when aggregating two providers returning the same ISBN", async () => {
    const isbn = "9780132350884";
    const p1: BookProvider = {
      name: "p1",
      search: vi.fn().mockResolvedValue([
        sampleBook({ id: "1", source: "p1", title: "Clean Code", isbn }),
      ]),
    };
    const p2: BookProvider = {
      name: "p2",
      search: vi.fn().mockResolvedValue([
        sampleBook({ id: "2", source: "p2", title: "Clean Code", isbn }),
      ]),
    };

    const service = new BookSearchService({
      primaryProvider: p1,
      fallbackProviders: [p2],
      strategy: "aggregate",
      maxResults: 10,
    });

    const result = await service.searchDetailed({ title: "x" });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].isbn).toBe(isbn);
  });

  it("uses cache on second identical searchDetailed when cache is configured", async () => {
    const primary: BookProvider = {
      name: "primary",
      search: vi.fn().mockResolvedValue([sampleBook()]),
    };
    const cache = new MemoryCache();

    const service = new BookSearchService({
      primaryProvider: primary,
      fallbackProviders: [],
      cache,
      cacheTtlMs: 60_000,
    });

    const first = await service.searchDetailed({ title: "cached" });
    const second = await service.searchDetailed({ title: "cached" });

    expect(primary.search).toHaveBeenCalledOnce();
    expect(first.meta.cacheHit).toBeFalsy();
    expect(second.meta.cacheHit).toBe(true);
  });
});
