import { Book } from "../../core/book.model";
import { BookSearchQuery } from "../../core/book-search-query.model";
import { BookProvider } from "../../core/book-provider";
import { ProviderError } from "../../core/errors";
import { HttpClient } from "../../core/http-client";
import { mapGoogleBooksResponse } from "./google-books.mapper";

type GoogleBooksApiResponse = {
  items?: Array<{
    id?: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;
    };
  }>;
};

export class GoogleBooksProvider implements BookProvider {
  public readonly name = "google-books";

  constructor(private readonly httpClient: HttpClient) {}

  async search(query: BookSearchQuery): Promise<Book[]> {
    try {
      const response = await this.httpClient.get<GoogleBooksApiResponse>(this.buildUrl(query));

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      return mapGoogleBooksResponse(response.data);
    } catch (error) {
      throw new ProviderError(this.name, "Failed to search Google Books", error);
    }
  }

  private buildUrl(query: BookSearchQuery): string {
    const searchTerms: string[] = [];

    if (query.title) searchTerms.push(`intitle:${query.title}`);
    if (query.author) searchTerms.push(`inauthor:${query.author}`);
    if (query.publisher) searchTerms.push(`inpublisher:${query.publisher}`);
    if (query.isbn) searchTerms.push(`isbn:${query.isbn}`);
    if (query.yearPublished) searchTerms.push(String(query.yearPublished));

    const q = encodeURIComponent(searchTerms.join(" "));
    return `/volumes?q=${q}&maxResults=10`;
  }
}