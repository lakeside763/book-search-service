import type { Book } from '../../core/models/book.model';

export type OpenLibraryResponse = {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    publisher?: string[];
    first_publish_year?: number;
    isbn?: string[];
  }>;
};

function extractIsbn(isbns?: string[]): string | undefined {
  const isbn13 = isbns?.find((isbn) => isbn.length === 13);
  if (isbn13) return isbn13;

  return isbns?.find((isbn) => isbn.length === 10);
}

export class OpenLibraryMapper {
  toBooks(payload: OpenLibraryResponse): Book[] {
    return (payload.docs ?? [])
      .map((doc): Book | null => {
        if (!doc.title) return null;

        const id = doc.key ?? doc.title;

        return {
          id,
          source: 'open-library',
          title: doc.title,
          authors: doc.author_name ?? [],
          publisher: doc.publisher?.[0],
          yearPublished: doc.first_publish_year,
          isbn: extractIsbn(doc.isbn),
        } satisfies Book;
      })
      .filter((book): book is Book => book !== null);
  }
}