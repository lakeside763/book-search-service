import { Book } from "../../core/book.model";
import { BookSearchQuery } from "../../core/book-search-query.model";
import { BookProvider } from "../../core/book-provider";
import { ProviderError } from "../../core/errors";
import { HttpClient } from "../../core/http-client";
import { mapOpenLibraryResponse } from "./open-library.mapper";

type OpenLibraryApiResponse = {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    publisher?: string[];
    first_publish_year?: number;
    isbn?: string[];
  }>;
};

export class OpenLibraryProvider implements BookProvider {
  public readonly name = "open-library";

  constructor(private readonly httpClient: HttpClient) {}

  async search(query: BookSearchQuery): Promise<Book[]> {
    try {
      const response = await this.httpClient.get<OpenLibraryApiResponse>(this.buildUrl(query));

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      return mapOpenLibraryResponse(response.data);
    } catch (error) {
      throw new ProviderError(this.name, "Failed to search Open Library", error);
    }
  }

  private buildUrl(query: BookSearchQuery): string {
    const params = new URLSearchParams();

    if (query.title) params.set("title", query.title);
    if (query.author) params.set("author", query.author);
    if (query.publisher) params.set("publisher", query.publisher);
    if (query.yearPublished) params.set("first_publish_year", String(query.yearPublished));
    if (query.isbn) params.set("isbn", query.isbn);

    params.set("limit", "10");

    return `/search.json?${params.toString()}`;
  }
}