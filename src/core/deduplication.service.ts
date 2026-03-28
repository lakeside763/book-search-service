import { BookCandidateGroup } from "./models/book-candidate-group.model";
import { Book } from "./models/book.model";

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildKey(book: Book): string {
  if (book.isbn) {
    return `isbn:${normalize(book.isbn)}`;
  }

  const title = normalize(book.title);
  const authors = [...book.authors]
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join("|")

  return `title-authors:${title}:${authors}`;
}

export class DeduplicationService {
  group(books: Book[]): BookCandidateGroup[] {
    const groups = new Map<string, Book[]>();

    for (const book of books) {
      const key = buildKey(book);
      const existing = groups.get(key) ?? [];
      existing.push(book);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([key, groupedBooks]) => ({
      key,
      books: groupedBooks,
    }))
  }

  deduplicate(books: Book[]): Book[] {
    const groups = this.group(books);

    return groups.map((group) => group.books[0]);
  }
}