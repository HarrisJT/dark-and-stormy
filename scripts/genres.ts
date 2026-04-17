export type GenreConfig = {
  slug: string;
  name: string; // must match "name" field in the JSON file
  file: string; // e.g. "src/data/mysteries.json"
  strategy: "cascade" | "claude-only" | "standard-ebooks-then-claude";
  defaultCount: number; // default batch size per run
  promptHints: {
    bookList: string; // injected into Haiku book list prompt
    openingLine: string; // injected into Sonnet extraction/fallback prompt
  };
};

const OPENING_LINE_BASE =
  "Always include the complete first sentence — never truncate with '...' or cut off mid-sentence. If the work is less well-known, include 2-3 sentences so the opening is recognizable enough to be guessable. The goal is fun and recognizability.";

export const GENRES: GenreConfig[] = [
  {
    slug: "novels-pre-1900",
    name: "Novels Pre-1900",
    file: "src/data/novels-pre-1900.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on literary fiction published before 1900. Do NOT include genre fiction such as mysteries, detective fiction, sci-fi, horror, or fantasy. Include novels from multiple countries and traditions.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "novels-1900-1950",
    name: "Novels 1900-1950",
    file: "src/data/novels-1900-1950.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on literary fiction published between 1900 and 1950. Do NOT include genre fiction such as mysteries, detective fiction, sci-fi, horror, or fantasy. Include novels from multiple countries and traditions.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "novels-1950-present",
    name: "Novels 1950-Present",
    file: "src/data/novels-1950-present.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on literary fiction published from 1950 to the present. Do NOT include genre fiction such as mysteries, detective fiction, sci-fi, horror, or fantasy. Include novels from multiple countries and traditions.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "sci-fi-fantasy",
    name: "Sci-Fi/Fantasy",
    file: "src/data/sci-fi-fantasy.json",
    strategy: "cascade",
    defaultCount: 30,
    promptHints: {
      bookList:
        "Focus on recognizable science fiction and fantasy genre classics. Include iconic works that trivia players are likely to know.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "mysteries",
    name: "Mysteries",
    file: "src/data/mysteries.json",
    strategy: "cascade",
    defaultCount: 30,
    promptHints: {
      bookList:
        "Focus on detective fiction, crime novels, and thrillers. Include classic and well-known modern mysteries.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "poetry",
    name: "Poetry",
    file: "src/data/poetry.json",
    strategy: "claude-only",
    defaultCount: 20,
    promptHints: {
      bookList:
        "Focus on individual poems (not collections) that are well-known and recognizable. Include poems from various eras and traditions.",
      openingLine: `${OPENING_LINE_BASE} Include the full first line always; add more lines if needed for recognizability. Each entry is an individual poem, not a poetry collection.`,
    },
  },
  {
    slug: "short-stories",
    name: "Short Stories",
    file: "src/data/short-stories.json",
    strategy: "standard-ebooks-then-claude",
    defaultCount: 20,
    promptHints: {
      bookList:
        "Focus on individual short stories (not collections) that are well-known and recognizable. Include classic short stories that trivia players might know.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "non-fiction",
    name: "Non-Fiction",
    file: "src/data/non-fiction.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on literary and narrative non-fiction only — journalism, memoir, creative non-fiction, narrative history. Do NOT include academic texts, self-help books, or business books.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "childrens-books",
    name: "Children's Books",
    file: "src/data/childrens-books.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on well-known children's literature — picture books, middle grade, young adult classics. Include books that are iconic and widely recognized.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "movies",
    name: "Movies",
    file: "src/data/movies.json",
    strategy: "cascade",
    defaultCount: 40,
    promptHints: {
      bookList:
        "Focus on books that are primarily known as mainstream adult films — e.g. Jaws, The Shining, The Godfather, Gone Girl, Forrest Gump. Do NOT include literary classics that happen to have film adaptations — the book should be primarily known as a movie. Do NOT include children's or family films.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "childrens-movies",
    name: "Children's Movies",
    file: "src/data/childrens-movies.json",
    strategy: "cascade",
    defaultCount: 20,
    promptHints: {
      bookList:
        "Focus on books that are primarily known as children's or family films — e.g. Bambi, Matilda, The BFG, Paddington, Charlotte's Web, Babe. Do NOT include mainstream adult films. The book should be primarily known as a children's or family movie.",
      openingLine: OPENING_LINE_BASE,
    },
  },
  {
    slug: "shakespeare",
    name: "Shakespeare",
    file: "src/data/shakespeare.json",
    strategy: "standard-ebooks-then-claude",
    defaultCount: 15,
    promptHints: {
      bookList:
        "List Shakespeare plays from the canonical 37. Include all types: tragedies, comedies, histories, and romances.",
      openingLine: `${OPENING_LINE_BASE} Format opening lines as "SPEAKER: Their dialogue" — e.g. "BERNARDO: Who's there?" Prologues and Choruses have no speaker tag. Include enough lines that a Shakespeare fan could identify the play.`,
    },
  },
];

export function getGenreBySlug(slug: string): GenreConfig | undefined {
  return GENRES.find((g) => g.slug === slug);
}
