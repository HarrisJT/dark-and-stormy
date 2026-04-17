import type { Entry, GenreData } from "types";
import { invariant } from "./invariant";

export function pickEntry(
	genreName: string,
	allGenres: GenreData[],
	usedEntries: Record<string, number[]>,
): { entry: Entry; usedEntries: Record<string, number[]> } {
	const genreData = allGenres.find((g) => g.name === genreName);
	if (!genreData) throw new Error(`Genre not found: ${genreName}`);

	const { entries } = genreData;
	const used = new Set(usedEntries[genreName] ?? []);

	let available = entries
		.map((entry, index) => ({ entry, index }))
		.filter(({ index }) => !used.has(index));

	// Reset pool atomically when all entries have been used once.
	if (available.length === 0) {
		available = entries.map((entry, index) => ({ entry, index }));
	}

	const pick = available[Math.floor(Math.random() * available.length)];
	invariant(pick, "available was non-empty but pick was undefined");

	const wasReset = available.length === entries.length && used.size > 0;
	const newUsed = wasReset ? [pick.index] : [...used, pick.index];

	return {
		entry: pick.entry,
		usedEntries: { ...usedEntries, [genreName]: newUsed },
	};
}
