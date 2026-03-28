export type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  yearPublished?: number;
  isbn?: string;
  source: string;
  providerId?: string;
}


// export type Book = {
//   id: string;
//   title: string;
//   authors: string[];
//   publisher?: string;
//   yearPublished?: number;
//   isbn?: string;
//   source: string;

//   providerId?: string;

//   subtitle?: string;

//   isbn10?: string;
//   isbn13?: string;

//   description?: string;
//   thumbnailUrl?: string;
//   language?: string;
//   categories?: string[];

//   score?: number;
//   metadataCompletenessScore?: number;
// }