import { BookSearchQuery } from "./book-search-query.model";
import { ValidationError } from "./errors";

export function validateBookSearchQuery(query: BookSearchQuery): void {
  const hasAtLeastOneField = Boolean(
    query.title || query.author || query.publisher || query.yearPublished || query.isbn
  );

  if (!hasAtLeastOneField) {
    throw new ValidationError("At least one search field must be provided");
  }

  if (query.title !== undefined && !query.title.trim()) {
    throw new ValidationError("title cannot be empty");
  }

  if (query.author !== undefined && !query.author.trim()) {
    throw new ValidationError("author cannot be empty");
  }

  if (query.publisher !== undefined && !query.publisher.trim()) {
    throw new ValidationError("publisher cannot be empty");
  }

  if (query.yearPublished !== undefined) {
    const currentYear = new Date().getFullYear();

    if (
      !Number.isInteger(query.yearPublished) ||
      query.yearPublished < 0 ||
      query.yearPublished > currentYear
    ) {
      throw new ValidationError("yearPublished must be a valid year");
    }
  }

  if (query.isbn !== undefined) {
    const normalizedIsbn = query.isbn.replace(/[-\s]/g, "");

    if (!/^\d{10}(\d{3})?$/.test(normalizedIsbn)) {
      throw new ValidationError("isbn must be a valid ISBN-10 or ISBN-13");
    }
  }
}