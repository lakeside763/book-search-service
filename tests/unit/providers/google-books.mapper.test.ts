import { describe, expect, it } from "vitest";
import { GoogleBooksMapper, type GoogleBooksResponse } from "../../../src/providers/google/google-books.mapper";

describe("GoogleBooksMapper", () => {
  const mapper = new GoogleBooksMapper();

  it("maps a valid Google item to Book with id, source, title, authors, publisher, yearPublished, isbn", () => {
    const response: GoogleBooksResponse = {
      items: [
        {
          id: "abc123",
          volumeInfo: {
            title: "Clean Code",
            authors: ["Robert C. Martin"],
            publisher: "Prentice Hall",
            publishedDate: "2008-08-01",
            industryIdentifiers: [
              { type: "ISBN_13", identifier: "9780132350884" },
              { type: "ISBN_10", identifier: "0132350882" },
            ],
          },
        },
      ],
    };

    const books = mapper.toBooks(response);

    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({
      id: "abc123",
      source: "google-books",
      title: "Clean Code",
      authors: ["Robert C. Martin"],
      publisher: "Prentice Hall",
      yearPublished: 2008,
      isbn: "9780132350884",
    });
  });

  it("drops items without a title", () => {
    const response: GoogleBooksResponse = {
      items: [
        { id: "x", volumeInfo: { title: "Valid" } },
        { id: "y", volumeInfo: {} },
      ],
    };

    const books = mapper.toBooks(response);
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe("Valid");
  });

  it("returns empty array when items is missing", () => {
    expect(mapper.toBooks({})).toEqual([]);
  });
});
