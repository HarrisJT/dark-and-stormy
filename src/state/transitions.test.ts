import type { GameState } from "types";
import { describe, expect, it } from "vitest";
import { assertTransition, getCurrentPlayer } from "./transitions";

function baseState(overrides: Partial<GameState> = {}): GameState {
	return {
		phase: "draw",
		players: [
			{
				name: "Alice",
				score: 0,
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
		deckDrawCount: 0,
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		usedEntries: {},
		...overrides,
	};
}

describe("assertTransition", () => {
	it("does not throw when phase matches and required fields are set", () => {
		const state = baseState({
			phase: "prompt",
			currentEntry: { openingLines: "x", title: "T", author: "A", year: 2000 },
			currentGenre: "Poetry",
		});
		expect(() => assertTransition(state, "prompt", "TEST")).not.toThrow();
	});

	it("throws when phase does not match", () => {
		const state = baseState({ phase: "draw" });
		expect(() => assertTransition(state, "prompt", "TEST")).toThrow(/"draw"/);
	});

	it("accepts an array of valid source phases", () => {
		const state = baseState({
			phase: "judge",
			currentEntry: { openingLines: "x", title: "T", author: "A", year: 2000 },
			currentGenre: "Poetry",
		});
		expect(() =>
			assertTransition(state, ["prompt", "judge"], "TEST"),
		).not.toThrow();
	});

	it("throws when a required field for the phase is null", () => {
		// prompt phase requires currentEntry and currentGenre
		const state = baseState({
			phase: "prompt",
			currentEntry: null,
			currentGenre: null,
		});
		expect(() => assertTransition(state, "prompt", "TEST")).toThrow(
			/currentEntry/,
		);
	});
});

describe("getCurrentPlayer", () => {
	it("returns the player at currentPlayerIndex", () => {
		const state = baseState({ currentPlayerIndex: 1 });
		expect(getCurrentPlayer(state).name).toBe("Bob");
	});

	it("throws when currentPlayerIndex is out of bounds", () => {
		const state = baseState({ currentPlayerIndex: 99 });
		expect(() => getCurrentPlayer(state)).toThrow(/currentPlayerIndex/);
	});
});
