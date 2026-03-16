import { Book } from "../../core/book.model";

type OpenLibraryResponse = {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    publisher?: string[];
    first_publish_year?: number;
    isbn?: string[];
  }>;
};

export function mapOpenLibraryResponse(response: OpenLibraryResponse): Book[] {
  return (response.docs ?? []).map((doc) => ({
    id: doc.key ?? `${doc.title ?? "unknown"}-open-library`,
    title: doc.title ?? "Unknown title",
    authors: doc.author_name ?? [],
    publisher: doc.publisher?.[0] ?? "",
    yearPublished: doc.first_publish_year ?? 0,
    isbn: doc.isbn?.[0] ?? "",
    source: "open-library",
  }));
}