export type EntrySource =
  | "wikiquote"
  | "standard-ebooks"
  | "gutenberg"
  | "ai-generated"
  | "ai-low-confidence"
  | "ai-unsure";

export type ReviewEntryStatus = "pending" | "approved" | "rejected";

export type ReviewEntry = {
  openingLines: string;
  title: string;
  author: string;
  year: number;
  source: EntrySource;
  status: ReviewEntryStatus;
};

export type ReviewFile = {
  genre: string;
  targetFile: string;
  entries: ReviewEntry[];
};
