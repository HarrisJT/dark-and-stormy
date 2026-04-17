import type { GameState, PersistedState } from "types";
import { CARD_TYPES, GAME_PHASES, STORAGE_VERSION } from "types";
import { z } from "zod";
import { EntrySchema } from "./data";

const STORAGE_KEY = "darkandstormy_gamestate";

const CardSchema = z.object({
	type: z.enum(CARD_TYPES),
	genre: z.string().nullable(),
	label: z.string(),
});

const GenreResultSchema = z.object({
	correct: z.number(),
	incorrect: z.number(),
});

const PlayerStatsSchema = z.object({
	correct: z.number(),
	incorrect: z.number(),
	currentStreak: z.number(),
	bestStreak: z.number(),
	genreResults: z.record(z.string(), GenreResultSchema),
});

const PlayerSchema = z.object({
	name: z.string(),
	score: z.number(),
	stats: PlayerStatsSchema,
});

const GameStateSchema = z.object({
	phase: z.enum(GAME_PHASES),
	players: z.array(PlayerSchema),
	currentPlayerIndex: z.number(),
	targetScore: z.number(),
	deck: z.array(CardSchema),
	deckDrawCount: z.number(),
	currentCard: CardSchema.nullable(),
	currentEntry: EntrySchema.nullable(),
	currentGenre: z.string().nullable(),
	usedEntries: z.record(z.string(), z.array(z.number())),
});

export function saveState(state: GameState): void {
	try {
		const blob: PersistedState = { version: STORAGE_VERSION, state };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
	} catch {
		// Throws in private browsing (Safari/Firefox), quota exceeded, or disabled storage.
	}
}

export function loadState(): GameState | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { version?: number; state?: unknown };
		if (parsed.version !== STORAGE_VERSION) return null;
		const result = GameStateSchema.safeParse(parsed.state);
		if (!result.success) return null;
		return result.data;
	} catch {
		return null;
	}
}

export function clearSavedState(): void {
	localStorage.removeItem(STORAGE_KEY);
}
