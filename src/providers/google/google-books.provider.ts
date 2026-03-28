import { Book } from "../../core/models/book.model";
import { BookSearchQuery } from "../../core/models/book-search-query.model";
import { BookProvider } from "../../core/book-provider";
import { ProviderError } from "../../core/errors";
import { HttpClient } from "../../core/http-client";
import { GoogleBooksMapper, type GoogleBooksResponse } from "./google-books.mapper";

function buildGoogleQuery(query: BookSearchQuery): string {
  const parts: string[] = [];

  if (query.title) parts.push(`intitle:${query.title}`);
  if (query.author) parts.push(`inauthor:${query.author}`);
  if (query.publisher) parts.push(`inpublisher:${query.publisher}`);
  if (query.isbn) parts.push(`isbn:${query.isbn}`);
  if (query.yearPublished) parts.push(String(query.yearPublished));

  return parts.join(" ");
}

export class GoogleBooksProvider implements BookProvider {
  public readonly name = "google-books";

  private readonly mapper = new GoogleBooksMapper();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly maxResults: number,
    private readonly apiKey?: string,
  ) {}

  async search(query: BookSearchQuery): Promise<Book[]> {
    try {
      const q = buildGoogleQuery(query);
      const params = new URLSearchParams({
        q,
        maxResults: String(this.maxResults),
      });
      const key = this.apiKey?.trim();
      if (key) {
        params.set("key", key);
      }

      const path = `/books/v1/volumes?${params.toString()}`;

      const response = await this.httpClient.get<GoogleBooksResponse>(path);
      return this.mapper.toBooks(response);
    } catch (error) {
      throw new ProviderError(this.name, "Failed to search Google Books", error);
    }
  }
}