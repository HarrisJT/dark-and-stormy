import type { GenreData } from "types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pickEntry } from "./entries";

const testData: GenreData[] = [
	{
		name: "Poetry",
		entries: [
			{
				openingLines: "Line A",
				title: "Poem A",
				author: "Author A",
				year: 2000,
			},
			{
				openingLines: "Line B",
				title: "Poem B",
				author: "Author B",
				year: 2001,
			},
		],
	},
	{
		name: "Mysteries",
		entries: [
			{
				openingLines: "Line C",
				title: "Mystery C",
				author: "Author C",
				year: 1999,
			},
		],
	},
];

afterEach(() => {
	vi.restoreAllMocks();
});

describe("pickEntry", () => {
	it("returns an entry from the requested genre", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const { entry } = pickEntry("Poetry", testData, {});
		expect(entry.title).toBe("Poem A");
	});

	it("tracks used indices for the genre", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const { entry, usedEntries } = pickEntry("Poetry", testData, {});
		const poetryEntries =
			testData.find((g) => g.name === "Poetry")?.entries ?? [];
		const idx = poetryEntries.indexOf(entry);
		expect(usedEntries.Poetry).toContain(idx);
	});

	it("does not repeat entries until all are exhausted", () => {
		vi.spyOn(Math, "random").mockReturnValue(0); // picks first available each time
		const { entry: first, usedEntries: used1 } = pickEntry(
			"Poetry",
			testData,
			{},
		);
		const { entry: second } = pickEntry("Poetry", testData, used1);
		expect(first.title).not.toBe(second.title);
	});

	it("resets when all entries in a genre are exhausted", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const { usedEntries: used1 } = pickEntry("Poetry", testData, {});
		const { usedEntries: used2 } = pickEntry("Poetry", testData, used1);
		// Both used -- next pick should reset pool to full
		const { entry: third, usedEntries: used3 } = pickEntry(
			"Poetry",
			testData,
			used2,
		);
		expect(["Poem A", "Poem B"]).toContain(third.title);
		expect(used3.Poetry).toHaveLength(1);
	});

	it("works for a genre with a single entry", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const { entry } = pickEntry("Mysteries", testData, {});
		expect(entry.title).toBe("Mystery C");
	});
});
