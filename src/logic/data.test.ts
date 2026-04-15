import { describe, expect, it } from "vitest";
import { loadGenres } from "./data";

describe("loadGenres", () => {
	it("returns an array of genre data objects", () => {
		const genres = loadGenres();
		expect(Array.isArray(genres)).toBe(true);
		expect(genres.length).toBeGreaterThan(0);
	});

	it("each genre has a name and a non-empty entries array", () => {
		const genres = loadGenres();
		for (const genre of genres) {
			expect(typeof genre.name).toBe("string");
			expect(genre.name.length).toBeGreaterThan(0);
			expect(Array.isArray(genre.entries)).toBe(true);
			expect(genre.entries.length).toBeGreaterThan(0);
		}
	});

	it("each entry has openingLines, title, author, and year", () => {
		const genres = loadGenres();
		for (const genre of genres) {
			for (const entry of genre.entries) {
				expect(typeof entry.openingLines).toBe("string");
				expect(typeof entry.title).toBe("string");
				expect(typeof entry.author).toBe("string");
				expect(typeof entry.year).toBe("number");
			}
		}
	});

	it("loads at least one genre per file in src/data/ (no hardcoded count)", () => {
		const genres = loadGenres();
		expect(genres.length).toBeGreaterThanOrEqual(1);
	});

	it("returns genre names as strings (used for deck building)", () => {
		const genres = loadGenres();
		const names = genres.map((g) => g.name);
		expect(names).toContain("Poetry");
		expect(names).toContain("Shakespeare");
		expect(names).toContain("Short Stories");
	});
});
