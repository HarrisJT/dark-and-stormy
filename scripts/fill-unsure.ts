// scripts/fill-unsure.ts
// Interactive CLI to fill in empty openingLines across review/*.json files.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import { spawn, spawnSync } from "node:child_process";
import type { ReviewFile } from "./types.js";

const reviewDir = path.resolve("review");

type Target = {
  filePath: string;
  entryIndex: number;
};

function loadTargets(): Target[] {
  const files = fs
    .readdirSync(reviewDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(reviewDir, f));

  const targets: Target[] = [];
  for (const filePath of files) {
    let data: ReviewFile;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ReviewFile;
    } catch {
      continue;
    }
    data.entries.forEach((e, i) => {
      if (!e.openingLines || e.openingLines.trim() === "") {
        targets.push({ filePath, entryIndex: i });
      }
    });
  }
  return targets;
}

function readFile(filePath: string): ReviewFile {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ReviewFile;
}

function writeFile(filePath: string, data: ReviewFile): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function googleUrl(title: string, author: string): string {
  const q = `what are the opening lines to "${title}" by ${author}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function openUrl(url: string): void {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

const COLOR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function ask(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

// ---------------------------------------------------------------------------
// Editor-based multi-line entry
// ---------------------------------------------------------------------------

function pickEditor(): { cmd: string; args: string[] } {
  const env = process.env.VISUAL ?? process.env.EDITOR;
  if (env && env.trim() !== "") {
    const parts = env.split(" ");
    return { cmd: parts[0]!, args: parts.slice(1) };
  }
  if (process.platform === "win32") {
    return { cmd: "notepad", args: [] };
  }
  return { cmd: "nano", args: [] };
}

function editInEditor(
  title: string,
  author: string,
  year: number,
  url: string,
): string | null {
  const tmp = path.join(
    os.tmpdir(),
    `opening-lines-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`,
  );
  const header = [
    "",
    "",
    "# ==========================================================",
    `# Title:  ${title}`,
    `# Author: ${author}`,
    `# Year:   ${year}`,
    `# Google: ${url}`,
    "#",
    "# Type/paste the opening line(s) ABOVE this block.",
    "# Lines starting with # are ignored.",
    "# Save the file and close the editor to continue.",
    "# Leave blank (or delete everything) to skip without saving.",
    "# ==========================================================",
    "",
  ].join("\n");
  fs.writeFileSync(tmp, header);

  const { cmd, args } = pickEditor();
  const result = spawnSync(cmd, [...args, tmp], { stdio: "inherit" });
  if (result.status !== 0 && result.error) {
    console.error(`Editor failed: ${result.error.message}`);
    try {
      fs.unlinkSync(tmp);
    } catch {}
    return null;
  }

  const raw = fs.readFileSync(tmp, "utf-8");
  try {
    fs.unlinkSync(tmp);
  } catch {}

  const cleaned = raw
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#"))
    .join("\n")
    .trim();

  return cleaned === "" ? null : cleaned;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const targets = loadTargets();
  if (targets.length === 0) {
    console.log("No empty entries to fill. You're done!");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const editor = pickEditor();
  console.log(
    `${COLOR.bold}Found ${targets.length} empty entries.${COLOR.reset} ${COLOR.dim}(editor: ${editor.cmd})${COLOR.reset}\n`,
  );

  let i = 0;
  while (i < targets.length) {
    const target = targets[i]!;
    const data = readFile(target.filePath);
    const entry = data.entries[target.entryIndex];
    if (!entry) {
      i++;
      continue;
    }
    if (entry.openingLines && entry.openingLines.trim() !== "") {
      i++;
      continue;
    }

    clearScreen();
    const progress = `[${i + 1}/${targets.length}]`;
    const url = googleUrl(entry.title, entry.author);
    console.log(
      `${COLOR.bold}${COLOR.cyan}${progress} ${entry.title}${COLOR.reset}`,
    );
    console.log(`  ${COLOR.dim}Author:${COLOR.reset} ${entry.author}`);
    console.log(`  ${COLOR.dim}Year:${COLOR.reset}   ${entry.year}`);
    console.log(`  ${COLOR.dim}Genre:${COLOR.reset}  ${data.genre}`);
    console.log(`  ${COLOR.dim}Source:${COLOR.reset} ${entry.source}`);
    console.log(
      `  ${COLOR.dim}File:${COLOR.reset}   ${path.basename(target.filePath)}`,
    );
    console.log(`\n  ${COLOR.blue}${url}${COLOR.reset}\n`);
    console.log(
      `${COLOR.bold}Actions:${COLOR.reset}  ${COLOR.green}[Enter]${COLOR.reset} edit in ${editor.cmd}   ${COLOR.yellow}[o]${COLOR.reset}pen URL   ${COLOR.yellow}[s]${COLOR.reset}kip   ${COLOR.red}[r]${COLOR.reset}eject   ${COLOR.red}[q]${COLOR.reset}uit`,
    );
    console.log(
      `${COLOR.dim}(In the editor: paste/type lines, save the file, then close it.)${COLOR.reset}`,
    );

    const choice = (await ask(rl, "> ")).trim().toLowerCase();

    if (choice === "q") {
      console.log("\nBye!");
      break;
    }
    if (choice === "s") {
      i++;
      continue;
    }
    if (choice === "r") {
      entry.status = "rejected";
      writeFile(target.filePath, data);
      console.log(`${COLOR.red}Rejected.${COLOR.reset}`);
      i++;
      continue;
    }
    if (choice === "o") {
      openUrl(url);
      console.log(`${COLOR.dim}Opened in browser.${COLOR.reset}`);
      await ask(
        rl,
        `${COLOR.dim}Press Enter when ready to edit...${COLOR.reset} `,
      );
    }

    const lines = editInEditor(entry.title, entry.author, entry.year, url);
    if (lines === null) {
      console.log(
        `${COLOR.yellow}No content saved — leaving entry unchanged. (Use 's' to skip or 'r' to reject.)${COLOR.reset}`,
      );
      const again = (
        await ask(rl, "Retry this one? [Y/n] ")
      )
        .trim()
        .toLowerCase();
      if (again === "n") i++;
      continue;
    }

    entry.openingLines = lines;
    entry.source = "ai-generated";
    entry.status = "pending";
    writeFile(target.filePath, data);
    console.log(`${COLOR.green}✓ Saved.${COLOR.reset}`);
    console.log(`${COLOR.dim}${lines.slice(0, 120)}${lines.length > 120 ? "…" : ""}${COLOR.reset}`);
    await ask(rl, "Press Enter for next... ");
    i++;
  }

  rl.close();
  console.log(`\n${COLOR.bold}Done.${COLOR.reset}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
