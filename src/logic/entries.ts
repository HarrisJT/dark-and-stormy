import type { Entry, GenreData, RNG } from "types";
import { invariant } from "./invariant";

export function pickEntry(
	genreName: string,
	allGenres: GenreData[],
	usedEntries: Record<string, number[]>,
	rng: RNG = Math.random,
): { entry: Entry; usedEntries: Record<string, number[]> } {
	const genreData = allGenres.find((g) => g.name === genreName);
	if (!genreData) throw new Error(`Genre not found: ${genreName}`);

	const { entries } = genreData;
	const used = usedEntries[genreName] ?? [];

	let available = entries
		.map((e, i) => ({ entry: e, index: i }))
		.filter(({ index }) => !used.includes(index));

	// Reset pool atomically when all entries have been used once.
	if (available.length === 0) {
		available = entries.map((e, i) => ({ entry: e, index: i }));
	}

	const pick = available[Math.floor(rng() * available.length)];
	invariant(pick, "available was non-empty but pick was undefined");

	const wasReset = available.length === entries.length && used.length > 0;
	const newUsed = wasReset ? [pick.index] : [...used, pick.index];

	return {
		entry: pick.entry,
		usedEntries: { ...usedEntries, [genreName]: newUsed },
	};
}
