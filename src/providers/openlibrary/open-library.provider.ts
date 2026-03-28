import type { Book } from '../../core/models/book.model';
import type { BookProvider } from '../../core/book-provider';
import type { BookSearchQuery } from '../../core/models/book-search-query.model';
import type { HttpClient } from '../../core/http-client';
import { ProviderError } from '../../core/errors';
import { OpenLibraryMapper, OpenLibraryResponse } from './open-library.mapper';

function buildOpenLibraryQuery(query: BookSearchQuery): string {
  if (query.isbn) return `isbn:${query.isbn}`;

  const parts: string[] = [];
  if (query.title) parts.push(`title:${query.title}`);
  if (query.author) parts.push(`author:${query.author}`);
  if (query.publisher) parts.push(`publisher:${query.publisher}`);

  return parts.join(' ');
}

export class OpenLibraryProvider implements BookProvider {
  readonly name = 'open-library';

  private readonly mapper = new OpenLibraryMapper();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly limit: number = 10,
  ) {}

  async search(query: BookSearchQuery): Promise<Book[]> {
    try {
      const q = buildOpenLibraryQuery(query);
      const path = `/search.json?q=${encodeURIComponent(q)}&limit=${this.limit}`;

      const response = await this.httpClient.get<OpenLibraryResponse>(path);
      return this.mapper.toBooks(response);
    } catch (error) {
      throw new ProviderError('Open Library search failed.', this.name, error);
    }
  }
}