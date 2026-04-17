// scripts/generate.ts
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { GENRES, getGenreBySlug } from "./genres.js";
import type { EntrySource, ReviewEntry, ReviewFile } from "./types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookSuggestion = {
  title: string;
  author: string;
  year: number;
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const genreArgIdx = args.indexOf("--genre");
const countArgIdx = args.indexOf("--count");

if (genreArgIdx === -1 || genreArgIdx + 1 >= args.length) {
  console.error("Usage: generate.ts --genre <slug> [--count <n>]");
  process.exit(1);
}

const genreSlug = args[genreArgIdx + 1];
if (!genreSlug) {
  console.error("Error: --genre requires a value");
  process.exit(1);
}

const genreOrUndef = getGenreBySlug(genreSlug);
if (!genreOrUndef) {
  console.error(
    `Unknown genre slug: "${genreSlug}". Valid slugs: ${GENRES.map((g) => g.slug).join(", ")}`,
  );
  process.exit(1);
}
// biome-ignore lint/style/noNonNullAssertion: guarded by process.exit above
const genre = genreOrUndef!;

let targetCount = genre.defaultCount;
if (countArgIdx !== -1 && countArgIdx + 1 < args.length) {
  const countStr = args[countArgIdx + 1];
  if (countStr) {
    const parsed = parseInt(countStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetCount = parsed;
    }
  }
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Dedup
// ---------------------------------------------------------------------------

const dedupKey = (title: string, year: number): string =>
  `${title.toLowerCase().replace(/[^a-z0-9]/g, "")}_${year}`;

const dedupTitleKey = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]/g, "");

function buildDedupSet(): Set<string> {
  const keys = new Set<string>();

  // Read all src/data/*.json files
  const dataDir = path.resolve("src/data");
  if (fs.existsSync(dataDir)) {
    for (const file of fs.readdirSync(dataDir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(
          fs.readFileSync(path.join(dataDir, file), "utf-8"),
        ) as { entries?: Array<{ title?: string; year?: number }> };
        for (const entry of raw.entries ?? []) {
          if (entry.title && entry.year != null) {
            keys.add(dedupKey(entry.title, entry.year));
          }
        }
      } catch {
        // skip malformed files
      }
    }
  }

  // Read all review/*.json files (not review/archived/)
  const reviewDir = path.resolve("review");
  if (fs.existsSync(reviewDir)) {
    for (const file of fs.readdirSync(reviewDir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(
          fs.readFileSync(path.join(reviewDir, file), "utf-8"),
        ) as { entries?: Array<{ title?: string; year?: number }> };
        for (const entry of raw.entries ?? []) {
          if (entry.title && entry.year != null) {
            keys.add(dedupKey(entry.title, entry.year));
          }
        }
      } catch {
        // skip malformed files
      }
    }
  }

  return keys;
}

// ---------------------------------------------------------------------------
// WikiQuote cache
// ---------------------------------------------------------------------------

type WikiQuotePair = {
  openingLine: string;
  attribution: string;
};

let wikiquoteCache: WikiQuotePair[] | null = null;

function cleanWikiText(raw: string): string {
  return raw
    .replace(/\[\[w:[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[wikipedia:[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''([^']+)''/g, "$1")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{[^}]+\}\}/g, "")
    .trim();
}

async function fetchWikiquotePairs(): Promise<WikiQuotePair[]> {
  if (wikiquoteCache !== null) return wikiquoteCache;

  const url =
    "https://en.wikiquote.org/w/api.php?action=parse&page=Opening_lines&prop=wikitext&format=json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`WikiQuote fetch failed: ${res.status}`);
      wikiquoteCache = [];
      return [];
    }
    const data = (await res.json()) as {
      parse?: { wikitext?: { "*"?: string } };
    };
    const wikitext = data.parse?.wikitext?.["*"] ?? "";
    const lines = wikitext.split("\n");
    const pairs: WikiQuotePair[] = [];

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      if (!line || !nextLine) continue;

      // Opening line: starts with "* " but NOT "** "
      if (line.startsWith("* ") && !line.startsWith("** ")) {
        // Attribution: next line starts with "** "
        if (nextLine.startsWith("** ")) {
          const openingLine = cleanWikiText(line.slice(2));
          const attribution = cleanWikiText(nextLine.slice(3));
          if (openingLine && attribution) {
            pairs.push({ openingLine, attribution });
          }
        }
      }
    }

    wikiquoteCache = pairs;
    return pairs;
  } catch (err) {
    clearTimeout(timeout);
    console.warn("WikiQuote fetch error:", err);
    wikiquoteCache = [];
    return [];
  }
}

async function lookupWikiquote(
  title: string,
): Promise<{ openingLine: string } | null> {
  const pairs = await fetchWikiquotePairs();
  const normalizedTitle = dedupTitleKey(title);

  for (const pair of pairs) {
    const normalizedAttrib = dedupTitleKey(pair.attribution);
    if (
      normalizedAttrib.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedAttrib)
    ) {
      return { openingLine: pair.openingLine };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Standard Ebooks lookup
// ---------------------------------------------------------------------------

function toStandardEbooksSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function buildStandardEbooksRepoSlug(title: string, author: string): string {
  // Author: last name first — "Herman Melville" → "herman-melville"
  const authorSlug = toStandardEbooksSlug(author);
  const titleSlug = toStandardEbooksSlug(title);
  return `${authorSlug}_${titleSlug}`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractOpeningLineWithSonnet(
  rawText: string,
  title: string,
  author: string,
  openingLineHint: string,
): Promise<string | null> {
  const prompt = `The following is the opening text of "${title}" by ${author}. Extract the actual opening line(s) of the work — the first sentence the reader encounters in the narrative. ${openingLineHint}

Text:
${rawText}

Return only the opening line(s), nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content?.type === "text") {
      return content.text.trim();
    }
    return null;
  } catch (err) {
    console.warn("Sonnet extraction error:", err);
    return null;
  }
}

const SE_FILES = [
  "chapter-1.xhtml",
  "act-1.xhtml",
  "prologue.xhtml",
  "part-1.xhtml",
  "book-1.xhtml",
  "chapter-1-1.xhtml",
];

async function lookupStandardEbooks(
  title: string,
  author: string,
  openingLineHint: string,
): Promise<{ openingLine: string } | null> {
  const repoSlug = buildStandardEbooksRepoSlug(title, author);

  for (const file of SE_FILES) {
    const url = `https://raw.githubusercontent.com/standardebooks/${repoSlug}/master/src/epub/text/${file}`;
    await sleep(1000);

    const res = await fetchWithTimeout(url, 8000);
    if (!res || !res.ok) continue;

    const html = await res.text();
    const bodyIdx = html.indexOf("<body");
    if (bodyIdx === -1) continue;

    const bodyContent = html.slice(bodyIdx);
    const stripped = stripHtmlTags(bodyContent);
    const decoded = decodeHtmlEntities(stripped);
    const normalized = normalizeWhitespace(decoded);
    const excerpt = normalized.slice(0, 500);

    if (excerpt.length < 20) continue;

    const openingLine = await extractOpeningLineWithSonnet(
      excerpt,
      title,
      author,
      openingLineHint,
    );
    if (openingLine && openingLine.length > 5) {
      return { openingLine };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Gutenberg lookup
// ---------------------------------------------------------------------------

async function lookupGutenberg(
  title: string,
  author: string,
  openingLineHint: string,
): Promise<{ openingLine: string } | null> {
  const searchUrl = `https://gutendex.com/books/?search=${encodeURIComponent(title + " " + author)}`;

  await sleep(1500);
  const searchRes = await fetchWithTimeout(searchUrl, 10000);
  if (!searchRes || !searchRes.ok) return null;

  const searchData = (await searchRes.json()) as {
    results?: Array<{
      id?: number;
      title?: string;
      authors?: Array<{ name?: string }>;
    }>;
  };

  const results = searchData.results ?? [];
  const normalizedTitle = dedupTitleKey(title);

  let bookId: number | null = null;
  for (const result of results) {
    if (!result.title || result.id == null) continue;
    const resultTitle = dedupTitleKey(result.title);
    // Validate title match — substring comparison in both directions
    if (
      resultTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(resultTitle)
    ) {
      bookId = result.id;
      break;
    }
  }

  if (bookId === null) return null;

  const txtUrl = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`;
  await sleep(1500);
  const txtRes = await fetchWithTimeout(txtUrl, 12000);
  if (!txtRes || !txtRes.ok) return null;

  const text = await txtRes.text();
  const startMarker = "*** START OF";
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;

  const afterMarker = text.indexOf("\n", startIdx);
  if (afterMarker === -1) return null;

  const excerpt = text.slice(afterMarker + 1, afterMarker + 1 + 1500);

  const openingLine = await extractOpeningLineWithSonnet(
    excerpt,
    title,
    author,
    openingLineHint,
  );
  if (openingLine && openingLine.length > 5) {
    return { openingLine };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Claude Sonnet fallback
// ---------------------------------------------------------------------------

async function claudeFallback(
  title: string,
  author: string,
  year: number,
  openingLineHint: string,
): Promise<{ openingLines: string; source: EntrySource }> {
  const prompt = `What are the exact verbatim opening line(s) of "${title}" by ${author} (${year})?

${openingLineHint}

If you are not confident you know the exact wording, set confidence to "low" or "unsure".
If you genuinely don't know it, set openingLines to "" and confidence to "unsure".
Do not guess or paraphrase — accuracy is critical for a trivia game.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      tools: [
        {
          name: "record_opening_lines",
          description: "Record the opening lines and confidence level",
          input_schema: {
            type: "object" as const,
            properties: {
              openingLines: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low", "unsure"] },
            },
            required: ["openingLines", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "record_opening_lines" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { openingLines: "", source: "ai-unsure" };
    }

    const input = toolUse.input as { openingLines: string; confidence: string };
    const { openingLines, confidence } = input;

    if (confidence === "high" || confidence === "medium") {
      return { openingLines, source: "ai-generated" };
    } else if (confidence === "low") {
      return { openingLines, source: "ai-low-confidence" };
    } else {
      return { openingLines: "", source: "ai-unsure" };
    }
  } catch (err) {
    console.warn("Claude fallback error:", err);
    return { openingLines: "", source: "ai-unsure" };
  }
}

// ---------------------------------------------------------------------------
// Haiku book list generation
// ---------------------------------------------------------------------------

async function generateBookList(
  count: number,
  genreName: string,
  bookListHint: string,
  dedupSet: Set<string>,
  existingTitles: Array<{ title: string; author: string; year: number }>,
): Promise<BookSuggestion[]> {
  const dedupList =
    existingTitles.length > 0
      ? existingTitles.map((e) => `- "${e.title}" by ${e.author}`).join("\n")
      : "(none yet)";

  const prompt = `List ${count} recognizable ${genreName} books suitable for a trivia game about opening lines. ${bookListHint}

Players should have a reasonable chance of recognizing these — prefer well-known titles over obscure ones.

Already included (do not suggest these):
${dedupList}

Return a JSON array: [{"title": "...", "author": "...", "year": 1234}, ...]
Return ONLY the JSON array, no other text.`;

  const tryParse = async (retrying = false): Promise<BookSuggestion[]> => {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") return [];

    try {
      const raw = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(raw) as BookSuggestion[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (!retrying) {
        console.warn("Failed to parse book list JSON, retrying...");
        return tryParse(true);
      }
      console.warn("Failed to parse book list JSON on retry, skipping.");
      return [];
    }
  };

  return tryParse();
}

// ---------------------------------------------------------------------------
// Retry helper for rate limits
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [2000, 4000, 8000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes("429") || err.message.includes("529"));
      const is5xx =
        err instanceof Error &&
        /5\d\d/.test(err.message);
      const delay = delays[attempt];
      if ((isRateLimit || is5xx) && delay != null) {
        console.warn(`Rate limit / server error, retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// ---------------------------------------------------------------------------
// Review file helpers
// ---------------------------------------------------------------------------

function getReviewFilePath(slug: string): string {
  const now = new Date();
  const pad = (n: number, len = 2): string => String(n).padStart(len, "0");
  const datetime = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  return path.resolve(`review/${slug}-batch-${datetime}.json`);
}

function readReviewFile(filePath: string): ReviewFile {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ReviewFile;
    } catch {
      // fall through to default
    }
  }
  return { genre: "", targetFile: "", entries: [] };
}

function appendToReviewFile(
  filePath: string,
  entry: ReviewEntry,
  genre: string,
  targetFile: string,
): void {
  const current = readReviewFile(filePath);
  current.genre = genre;
  current.targetFile = targetFile;
  current.entries.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(current, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(
    `\nGenerating ${targetCount} entries for genre: ${genre.name} (${genre.slug})`,
  );
  console.log(`Strategy: ${genre.strategy}\n`);

  // Ensure review/ directory exists
  const reviewDir = path.resolve("review");
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }

  const dedupSet = buildDedupSet();

  // Build existing titles list for Haiku prompt
  const existingTitles: Array<{ title: string; author: string; year: number }> =
    [];
  const dataFile = path.resolve(genre.file);
  if (fs.existsSync(dataFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as {
        entries?: Array<{ title?: string; author?: string; year?: number }>;
      };
      for (const e of raw.entries ?? []) {
        if (e.title && e.author && e.year != null) {
          existingTitles.push({ title: e.title, author: e.author, year: e.year });
        }
      }
    } catch {
      // ignore
    }
  }

  // Generate book list
  console.log(`Asking Haiku for ${targetCount} book suggestions...`);
  const books = await withRetry(() =>
    generateBookList(
      targetCount,
      genre.name,
      genre.promptHints.bookList,
      dedupSet,
      existingTitles,
    ),
  );

  if (books.length === 0) {
    console.error("No books returned from Haiku. Exiting.");
    process.exit(1);
  }

  console.log(`Got ${books.length} suggestions. Processing...\n`);

  const reviewFilePath = getReviewFilePath(genre.slug);
  let processed = 0;

  for (const book of books) {
    processed++;

    if (!book.title || !book.author || book.year == null) {
      console.log(`[${processed}/${books.length}] ⚠ Skipping invalid entry`);
      continue;
    }

    // Dedup check
    const key = dedupKey(book.title, book.year);
    if (dedupSet.has(key)) {
      console.log(
        `[${processed}/${books.length}] ⟳ Skipping duplicate: "${book.title}"`,
      );
      continue;
    }

    let openingLines = "";
    // Every branch below assigns source before the entry is constructed
    let source: EntrySource | "" = "";

    if (genre.strategy === "claude-only") {
      // Poetry: go straight to Claude fallback
      const result = await withRetry(() =>
        claudeFallback(
          book.title,
          book.author,
          book.year,
          genre.promptHints.openingLine,
        ),
      );
      openingLines = result.openingLines;
      source = result.source;

      if (source === "ai-unsure" || openingLines === "") {
        console.log(
          `[${processed}/${books.length}] ⚠ Claude unsure: "${book.title}" by ${book.author} → ai-unsure (empty)`,
        );
      } else {
        console.log(
          `[${processed}/${books.length}] ✓ Claude fallback: "${book.title}" by ${book.author} → ${source}`,
        );
      }
    } else if (genre.strategy === "standard-ebooks-then-claude") {
      // Try SE first, then Claude fallback
      const seResult = await lookupStandardEbooks(
        book.title,
        book.author,
        genre.promptHints.openingLine,
      );

      if (seResult) {
        openingLines = seResult.openingLine;
        source = "standard-ebooks";
        console.log(
          `[${processed}/${books.length}] ✓ Standard Ebooks hit: "${book.title}" by ${book.author} → standard-ebooks`,
        );
      } else {
        const fallback = await withRetry(() =>
          claudeFallback(
            book.title,
            book.author,
            book.year,
            genre.promptHints.openingLine,
          ),
        );
        openingLines = fallback.openingLines;
        source = fallback.source;

        if (source === "ai-unsure" || openingLines === "") {
          console.log(
            `[${processed}/${books.length}] ✗ SE miss, ⚠ Claude unsure: "${book.title}" by ${book.author} → ai-unsure (empty)`,
          );
        } else {
          console.log(
            `[${processed}/${books.length}] ✗ SE miss, ✓ Claude fallback: "${book.title}" by ${book.author} → ${source}`,
          );
        }
      }
    } else {
      // cascade: WikiQuote → Standard Ebooks → Gutenberg → Claude fallback
      const wqResult = await lookupWikiquote(book.title);

      if (wqResult) {
        openingLines = wqResult.openingLine;
        source = "wikiquote";
        console.log(
          `[${processed}/${books.length}] ✓ WikiQuote hit: "${book.title}" by ${book.author} → wikiquote`,
        );
      } else {
        const seResult = await lookupStandardEbooks(
          book.title,
          book.author,
          genre.promptHints.openingLine,
        );

        if (seResult) {
          openingLines = seResult.openingLine;
          source = "standard-ebooks";
          console.log(
            `[${processed}/${books.length}] ✗ WikiQuote miss, ✓ Standard Ebooks hit: "${book.title}" by ${book.author} → standard-ebooks`,
          );
        } else {
          const gutResult = await lookupGutenberg(
            book.title,
            book.author,
            genre.promptHints.openingLine,
          );

          if (gutResult) {
            openingLines = gutResult.openingLine;
            source = "gutenberg";
            console.log(
              `[${processed}/${books.length}] ✗ WikiQuote miss, ✗ SE miss, ✓ Gutenberg hit: "${book.title}" by ${book.author} → gutenberg`,
            );
          } else {
            const fallback = await withRetry(() =>
              claudeFallback(
                book.title,
                book.author,
                book.year,
                genre.promptHints.openingLine,
              ),
            );
            openingLines = fallback.openingLines;
            source = fallback.source;

            if (source === "ai-unsure" || openingLines === "") {
              console.log(
                `[${processed}/${books.length}] ✗ All misses, ⚠ Claude unsure: "${book.title}" by ${book.author} → ai-unsure (empty)`,
              );
            } else {
              console.log(
                `[${processed}/${books.length}] ✗ All misses → Claude fallback → ${source}: "${book.title}" by ${book.author}`,
              );
            }
          }
        }
      }
    }

    // Write entry to review file (even if empty — reviewer can decide)
    const entry: ReviewEntry = {
      openingLines,
      title: book.title,
      author: book.author,
      year: book.year,
      source: source as EntrySource,
      status: "pending",
    };

    appendToReviewFile(reviewFilePath, entry, genre.slug, genre.file);

    // Add to dedup set so we don't produce duplicates within the same batch
    dedupSet.add(key);
  }

  console.log(`\nDone! Review file written to: ${reviewFilePath}`);
  console.log(`Processed ${processed} of ${books.length} suggestions.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
