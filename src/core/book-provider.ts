import { BookSearchQuery } from "./book-search-query.model";
import { Book } from "./book.model";

export interface BookProvider {
  readonly name: string;
  search(query:  BookSearchQuery): Promise<Book[]>;
}