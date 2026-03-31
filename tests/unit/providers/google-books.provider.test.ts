import { describe, expect, it, vi } from "vitest";
import { GoogleBooksProvider } from "../../../src/providers/google/google-books.provider";
import type { HttpClient } from "../../../src/core/http-client";
import type { GoogleBooksResponse } from "../../../src/providers/google/google-books.mapper";

describe("GoogleBooksProvider", () => {
  it("calls the HTTP client with a Google Books path containing intitle when only title is provided", async () => {
    const get = vi.fn().mockResolvedValue({ items: [] } satisfies GoogleBooksResponse);
    const httpClient: HttpClient = { get };

    const provider = new GoogleBooksProvider(httpClient, 10);
    await provider.search({ title: "Clean Code" });

    expect(get).toHaveBeenCalledOnce();
    const path = get.mock.calls[0][0] as string;
    expect(path).toMatch(/^\/books\/v1\/volumes\?/);
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("q")).toBe("intitle:Clean Code");
    expect(params.get("maxResults")).toBe("10");
  });

  it("includes inauthor in the query when author is provided", async () => {
    const get = vi.fn().mockResolvedValue({ items: [] });
    const httpClient: HttpClient = { get };

    const provider = new GoogleBooksProvider(httpClient, 10);
    await provider.search({ title: "Clean Code", author: "Robert C. Martin" });

    const path = get.mock.calls[0][0] as string;
    const params = new URLSearchParams(path.split("?")[1]);
    const q = params.get("q") ?? "";
    expect(q).toContain("intitle:Clean Code");
    expect(q).toContain("inauthor:Robert C. Martin");
  });

  it("appends API key when provided", async () => {
    const get = vi.fn().mockResolvedValue({ items: [] });
    const httpClient: HttpClient = { get };

    const provider = new GoogleBooksProvider(httpClient, 10, "my-key");
    await provider.search({ title: "x" });

    const path = get.mock.calls[0][0] as string;
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("key")).toBe("my-key");
  });
});
