// scripts/merge.ts
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas (same as src/logic/data.ts)
// ---------------------------------------------------------------------------

const EntrySchema = z.object({
  openingLines: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int(),
});

const GenreDataSchema = z.object({
  name: z.string().min(1),
  entries: z.array(EntrySchema),
});

type Entry = z.infer<typeof EntrySchema>;
type GenreData = z.infer<typeof GenreDataSchema>;

// ---------------------------------------------------------------------------
// Review file types
// ---------------------------------------------------------------------------

type ReviewEntry = {
  openingLines: string;
  title: string;
  author: string;
  year: number;
  source: string;
  status: string;
};

type ReviewFile = {
  genre: string;
  targetFile: string;
  entries: ReviewEntry[];
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const reviewDir = path.resolve("review");
  const archivedDir = path.join(reviewDir, "archived");

  if (!fs.existsSync(reviewDir)) {
    console.log("No review/ directory found. Nothing to merge.");
    return;
  }

  // Read all review/*.json files (not subdirectories)
  const reviewFiles = fs
    .readdirSync(reviewDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(reviewDir, f));

  if (reviewFiles.length === 0) {
    console.log("No review files found. Nothing to merge.");
    return;
  }

  console.log(`Found ${reviewFiles.length} review file(s).\n`);

  // Group approved entries by targetFile
  const approvedByTarget = new Map<string, Entry[]>();
  const rejectedCount: { total: number } = { total: 0 };
  const processedFiles: string[] = [];

  for (const filePath of reviewFiles) {
    let reviewData: ReviewFile;
    try {
      reviewData = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ReviewFile;
    } catch {
      console.warn(`Skipping malformed review file: ${filePath}`);
      continue;
    }

    processedFiles.push(filePath);
    let fileApproved = 0;
    let fileRejected = 0;

    for (const entry of reviewData.entries) {
      if (entry.status !== "approved") continue;

      // Strip source and status fields
      const stripped = {
        openingLines: entry.openingLines,
        title: entry.title,
        author: entry.author,
        year: entry.year,
      };

      // Validate with Zod (rejects empty openingLines via .min(1))
      const result = EntrySchema.safeParse(stripped);
      if (!result.success) {
        console.warn(
          `  ✗ Rejected "${entry.title}" (validation failed): ${result.error.message}`,
        );
        fileRejected++;
        rejectedCount.total++;
        continue;
      }

      const targetFile = path.resolve(reviewData.targetFile);
      if (!approvedByTarget.has(targetFile)) {
        approvedByTarget.set(targetFile, []);
      }
      approvedByTarget.get(targetFile)!.push(result.data);
      fileApproved++;
    }

    console.log(
      `${path.basename(filePath)}: ${fileApproved} approved, ${fileRejected} rejected`,
    );
  }

  if (approvedByTarget.size === 0) {
    console.log("\nNo approved entries to merge.");
  } else {
    console.log("\nMerging entries into data files...");

    for (const [targetFile, newEntries] of approvedByTarget) {
      if (!fs.existsSync(targetFile)) {
        console.warn(`  ✗ Target file not found: ${targetFile}`);
        continue;
      }

      let existing: GenreData;
      try {
        const raw = JSON.parse(
          fs.readFileSync(targetFile, "utf-8"),
        ) as unknown;
        const result = GenreDataSchema.safeParse(raw);
        if (!result.success) {
          console.warn(
            `  ✗ Target file has invalid structure: ${targetFile}`,
          );
          continue;
        }
        existing = result.data;
      } catch {
        console.warn(`  ✗ Could not read target file: ${targetFile}`);
        continue;
      }

      const merged: GenreData = {
        name: existing.name,
        entries: [...existing.entries, ...newEntries],
      };

      // Final validation
      const finalResult = GenreDataSchema.safeParse(merged);
      if (!finalResult.success) {
        console.warn(
          `  ✗ Final validation failed for ${targetFile}: ${finalResult.error.message}`,
        );
        continue;
      }

      fs.writeFileSync(targetFile, JSON.stringify(finalResult.data, null, "\t"));
      console.log(
        `  ✓ ${path.relative(process.cwd(), targetFile)}: added ${newEntries.length} entries (total: ${finalResult.data.entries.length})`,
      );
    }
  }

  // Archive processed review files
  if (processedFiles.length > 0) {
    if (!fs.existsSync(archivedDir)) {
      fs.mkdirSync(archivedDir, { recursive: true });
    }

    console.log("\nArchiving review files...");
    for (const filePath of processedFiles) {
      const dest = path.join(archivedDir, path.basename(filePath));
      fs.renameSync(filePath, dest);
      console.log(`  → ${path.basename(filePath)}`);
    }
  }

  // Summary
  const totalApproved = Array.from(approvedByTarget.values()).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );

  console.log("\n--- Summary ---");
  console.log(`Total approved: ${totalApproved}`);
  console.log(`Total rejected: ${rejectedCount.total}`);
  for (const [targetFile, entries] of approvedByTarget) {
    console.log(
      `  ${path.relative(process.cwd(), targetFile)}: ${entries.length} entries added`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
