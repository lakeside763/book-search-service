import { BookSearchQuery } from "./models/book-search-query.model";
import { Book } from "./models/book.model";

export interface BookProvider {
  readonly name: string;
  search(query:  BookSearchQuery): Promise<Book[]>;
}