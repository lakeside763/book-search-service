import { Book } from "../../core/book.model";

type GoogleBooksResponse = {
  items?: Array<{
    id?: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;
    };
  }>;
};

export function mapGoogleBooksResponse(response: GoogleBooksResponse): Book[] {
  return (response.items ?? []).map((item) => {
    const volumeInfo = item.volumeInfo ?? {};

    return {
      id: item.id ?? `${volumeInfo.title ?? "unknown"}-google-books`,
      title: volumeInfo.title ?? "Unknown title",
      authors: volumeInfo.authors ?? [],
      publisher: volumeInfo.publisher ?? "",
      yearPublished: extractYear(volumeInfo.publishedDate) ?? 0,
      isbn: extractIsbn(volumeInfo.industryIdentifiers) ?? "",
      source: "google-books",
    };
  });
}

function extractYear(publishedDate?: string): number | undefined {
  if (!publishedDate) {
    return undefined;
  }

  const match = publishedDate.match(/^(\d{4})/);
  return match ? Number(match[1]) : undefined;
}

function extractIsbn(
  identifiers?: Array<{ type?: string; identifier?: string }>
): string | undefined {
  if (!identifiers?.length) {
    return undefined;
  }

  const isbn13 = identifiers.find((entry) => entry.type === "ISBN_13")?.identifier;
  if (isbn13) {
    return isbn13;
  }

  return identifiers.find((entry) => entry.type === "ISBN_10")?.identifier;
}