import { describe, expect, it, vi } from "vitest";
import { GoogleBooksProvider } from "../../src/providers/google/google-books.provider";
import type { HttpClient } from "../../src/core/http-client";
import type { GoogleBooksResponse } from "../../src/providers/google/google-books.mapper";

describe("GoogleBooksProvider (mocked HTTP, real provider + mapper)", () => {
  const sampleApiResponse: GoogleBooksResponse = {
    items: [
      {
        id: "vol1",
        volumeInfo: {
          title: "Clean Code",
          authors: ["Robert C. Martin"],
          publisher: "Prentice Hall",
          publishedDate: "2008",
          industryIdentifiers: [{ type: "ISBN_13", identifier: "9780132350884" }],
        },
      },
    ],
  };

  it("calls the HTTP client with a volumes path and title-only q", async () => {
    const get = vi.fn().mockResolvedValue(sampleApiResponse);
    const httpClient: HttpClient = { get };
    const provider = new GoogleBooksProvider(httpClient, 10);

    await provider.search({ title: "Clean Code" });

    expect(get).toHaveBeenCalledOnce();
    const path = get.mock.calls[0][0] as string;
    expect(path).toContain("/books/v1/volumes?");
    const q = new URLSearchParams(path.split("?")[1]).get("q");
    expect(q).toBe("intitle:Clean Code");
  });

  it("includes author in q when provided", async () => {
    const get = vi.fn().mockResolvedValue(sampleApiResponse);
    const httpClient: HttpClient = { get };
    const provider = new GoogleBooksProvider(httpClient, 10);

    await provider.search({ title: "Clean Code", author: "Robert C. Martin" });

    const path = get.mock.calls[0][0] as string;
    const q = new URLSearchParams(path.split("?")[1]).get("q") ?? "";
    expect(q).toContain("intitle:Clean Code");
    expect(q).toContain("inauthor:Robert C. Martin");
  });

  it("returns books mapped from the Google Books API-shaped response", async () => {
    const get = vi.fn().mockResolvedValue(sampleApiResponse);
    const httpClient: HttpClient = { get };
    const provider = new GoogleBooksProvider(httpClient, 10);

    const books = await provider.search({ title: "Clean Code" });

    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({
      id: "vol1",
      title: "Clean Code",
      source: "google-books",
      isbn: "9780132350884",
    });
  });
});
