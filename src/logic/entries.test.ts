import { describe, expect, it } from "vitest";
import type { Entry, GenreData, RNG } from "types";
import { pickEntry } from "./entries";

// Cycles through a fixed sequence so picks are deterministic.
function makeSeqRng(...values: number[]): RNG {
	let i = 0;
	return () => values[i++ % values.length];
}

const testData: GenreData[] = [
	{
		name: "Poetry",
		entries: [
			{ openingLines: "Line A", title: "Poem A", author: "Author A", year: 2000 },
			{ openingLines: "Line B", title: "Poem B", author: "Author B", year: 2001 },
		],
	},
	{
		name: "Mysteries",
		entries: [
			{ openingLines: "Line C", title: "Mystery C", author: "Author C", year: 1999 },
		],
	},
];

describe("pickEntry", () => {
	it("returns an entry from the requested genre", () => {
		const rng = makeSeqRng(0); // always picks index 0
		const { entry } = pickEntry("Poetry", testData, {}, rng);
		expect(entry.title).toBe("Poem A");
	});

	it("tracks used indices for the genre", () => {
		const rng = makeSeqRng(0);
		const { entry, usedEntries } = pickEntry("Poetry", testData, {}, rng);
		const poetryEntries = testData[0].entries;
		const idx = poetryEntries.indexOf(entry);
		expect(usedEntries.Poetry).toContain(idx);
	});

	it("does not repeat entries until all are exhausted", () => {
		const rng = makeSeqRng(0); // picks first available each time
		const { entry: first, usedEntries: used1 } = pickEntry("Poetry", testData, {}, rng);
		const { entry: second } = pickEntry("Poetry", testData, used1, rng);
		expect(first.title).not.toBe(second.title);
	});

	it("resets when all entries in a genre are exhausted", () => {
		const rng = makeSeqRng(0);
		const { usedEntries: used1 } = pickEntry("Poetry", testData, {}, rng);
		const { usedEntries: used2 } = pickEntry("Poetry", testData, used1, rng);
		// Both used -- next pick should reset pool to full
		const { entry: third, usedEntries: used3 } = pickEntry("Poetry", testData, used2, rng);
		expect(["Poem A", "Poem B"]).toContain(third.title);
		expect(used3.Poetry).toHaveLength(1);
	});

	it("works for a genre with a single entry", () => {
		const rng = makeSeqRng(0);
		const { entry } = pickEntry("Mysteries", testData, {}, rng);
		expect(entry.title).toBe("Mystery C");
	});
});
