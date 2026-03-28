import { Book } from "./book.model";

export type BookCandidateGroup = {
  key: string;
  books: Book[];
}