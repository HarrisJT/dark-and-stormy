import type { GameState } from "types";
import { STORAGE_VERSION } from "types";
import { afterEach, describe, expect, it } from "vitest";
import { clearSavedState, loadState, saveState } from "./storage";

const STORAGE_KEY = "darkandstormy_gamestate";

const mockState: GameState = {
	phase: "draw",
	players: [
		{
			name: "Alice",
			score: 2,
			stats: {
				correct: 0,
				incorrect: 0,
				currentStreak: 0,
				bestStreak: 0,
				genreResults: {},
			},
		},
		{
			name: "Bob",
			score: 1,
			stats: {
				correct: 0,
				incorrect: 0,
				currentStreak: 0,
				bestStreak: 0,
				genreResults: {},
			},
		},
	],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

afterEach(() => {
	localStorage.removeItem(STORAGE_KEY);
});

describe("saveState / loadState", () => {
	it("round-trips a game state", () => {
		saveState(mockState);
		expect(loadState()).toEqual(mockState);
	});

	it("stores a versioned wrapper (not bare state)", () => {
		saveState(mockState);
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = JSON.parse(raw!);
		expect(parsed.version).toBe(STORAGE_VERSION);
		expect(parsed.state).toBeDefined();
	});

	it("returns null when nothing is saved", () => {
		expect(loadState()).toBeNull();
	});

	it("returns null for invalid JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{{");
		expect(loadState()).toBeNull();
	});

	it("returns null for a mismatched version (future migration gate)", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: 99, state: mockState }),
		);
		expect(loadState()).toBeNull();
	});
});

describe("clearSavedState", () => {
	it("removes saved state", () => {
		saveState(mockState);
		clearSavedState();
		expect(loadState()).toBeNull();
	});
});
