import type { GenreData } from "types";
import { z } from "zod";

const EntrySchema = z.object({
	openingLines: z.string().min(1),
	title: z.string().min(1),
	author: z.string().min(1),
	year: z.number().int(),
});

const GenreDataSchema = z.object({
	name: z.string().min(1),
	entries: z.array(EntrySchema).min(1),
});

// import.meta.glob is resolved by Vite at build time -- all JSON files
// in src/data/ are bundled automatically. Adding a new genre file
// requires no code changes here.
const modules = import.meta.glob("../data/*.json", { eager: true });

// Validated once at module load; both App.tsx and the reducer import this.
export const allGenres: GenreData[] = Object.values(modules)
	.map((raw, i) => {
		const result = GenreDataSchema.safeParse(raw);
		if (!result.success) {
			console.error(`Invalid genre data at index ${i}:`, result.error.message);
			return null;
		}
		return result.data as GenreData;
	})
	.filter((g): g is GenreData => g !== null);

export function loadGenres(): GenreData[] {
	return allGenres;
}

export function getGenreNames(): string[] {
	return allGenres.map((g) => g.name);
}
