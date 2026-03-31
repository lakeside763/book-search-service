import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors";
import { validateBookSearchQuery } from "../../../src/core/query-validator";

describe("validateBookSearchQuery", () => {
  it("passes when title is provided", () => {
    expect(() => validateBookSearchQuery({ title: "Clean Code" })).not.toThrow();
  });

  it("passes when only author is provided", () => {
    expect(() => validateBookSearchQuery({ author: "Robert C. Martin" })).not.toThrow();
  });

  it("passes when only publisher is provided", () => {
    expect(() => validateBookSearchQuery({ publisher: "O'Reilly" })).not.toThrow();
  });

  it("passes when only yearPublished is provided", () => {
    expect(() => validateBookSearchQuery({ yearPublished: 2008 })).not.toThrow();
  });

  it("passes when only isbn is provided", () => {
    expect(() => validateBookSearchQuery({ isbn: "9780132350884" })).not.toThrow();
  });

  it("fails when no search fields are provided", () => {
    expect(() => validateBookSearchQuery({})).toThrow(ValidationError);
    expect(() => validateBookSearchQuery({})).toThrow("At least one search field must be provided");
  });

  it("fails when title is only whitespace", () => {
    expect(() => validateBookSearchQuery({ title: "   " })).toThrow(ValidationError);
    expect(() => validateBookSearchQuery({ title: "   " })).toThrow("title cannot be empty");
  });

  it("fails when author is only whitespace", () => {
    expect(() => validateBookSearchQuery({ author: "  " })).toThrow("author cannot be empty");
  });

  it("fails when publisher is only whitespace", () => {
    expect(() => validateBookSearchQuery({ publisher: "\t" })).toThrow("publisher cannot be empty");
  });
});
