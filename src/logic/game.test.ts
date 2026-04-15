import type { RNG } from "types";
import { describe, expect, it } from "vitest";
import { loadGenres } from "./data";
import {
	advancePlayer,
	applyScore,
	checkWinner,
	createInitialState,
	getNextPlayerIndex,
} from "./game";

// Deterministic RNG for tests -- always returns 0 so shuffle is a no-op.
const deterministicRng: RNG = () => 0;

describe("createInitialState", () => {
	it("initializes players with zero scores", () => {
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		const names = state.players.map((p) => p.name).sort();
		expect(names).toEqual(["Alice", "Bob"]);
		for (const p of state.players) expect(p.score).toBe(0);
	});

	it("sets targetScore, starts on draw phase, deckDrawCount 0", () => {
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		expect(state.targetScore).toBe(8);
		expect(state.phase).toBe("draw");
		expect(state.currentPlayerIndex).toBe(0);
		expect(state.deckDrawCount).toBe(0);
	});

	it("creates a full deck (genre count + 5 specials -- no hardcoded 17)", () => {
		const genres = loadGenres();
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		expect(state.deck).toHaveLength(genres.length + 5);
	});

	it("randomizes player order (uses real Math.random by default)", () => {
		const orders = new Set<string>();
		for (let i = 0; i < 20; i++) {
			const state = createInitialState(["Alice", "Bob", "Carol"], 8);
			orders.add(state.players.map((p) => p.name).join(","));
		}
		expect(orders.size).toBeGreaterThan(1);
	});

	it("throws when fewer than MIN_PLAYERS names are provided", () => {
		expect(() => createInitialState(["Alice"], 8, deterministicRng)).toThrow(
			/MIN_PLAYERS|2 players/i,
		);
		expect(() => createInitialState([], 8, deterministicRng)).toThrow();
	});
});

describe("getNextPlayerIndex", () => {
	it("advances by 1", () => {
		expect(getNextPlayerIndex(0, 3)).toBe(1);
		expect(getNextPlayerIndex(1, 3)).toBe(2);
	});

	it("wraps around to 0", () => {
		expect(getNextPlayerIndex(1, 2)).toBe(0);
		expect(getNextPlayerIndex(2, 3)).toBe(0);
	});
});

describe("applyScore", () => {
	it("adds the given points to the scorer", () => {
		const players = [
			{ name: "Alice", score: 3 },
			{ name: "Bob", score: 5 },
		];
		const result1 = applyScore(players, 0, 1);
		expect(result1[0]?.score).toBe(4);
		const result2 = applyScore(players, 0, 2);
		expect(result2[0]?.score).toBe(5);
	});

	it("does not change other players", () => {
		const players = [
			{ name: "Alice", score: 3 },
			{ name: "Bob", score: 5 },
		];
		const result = applyScore(players, 0, 1);
		expect(result[1]?.score).toBe(5);
	});
});

describe("checkWinner", () => {
	it("returns null when no player has reached target", () => {
		const players = [
			{ name: "Alice", score: 7 },
			{ name: "Bob", score: 5 },
		];
		expect(checkWinner(players, 8)).toBeNull();
	});

	it("returns the index of the winning player", () => {
		const players = [
			{ name: "Alice", score: 8 },
			{ name: "Bob", score: 5 },
		];
		expect(checkWinner(players, 8)).toBe(0);
	});
});

describe("advancePlayer", () => {
	it("increments currentPlayerIndex and resets turn state", () => {
		const state = createInitialState(["Alice", "Bob"], 8);
		const next = advancePlayer(state);
		expect(next.currentPlayerIndex).toBe(1);
		expect(next.phase).toBe("draw");
		expect(next.currentCard).toBeNull();
		expect(next.currentEntry).toBeNull();
		expect(next.currentGenre).toBeNull();
	});

	it("wraps player index back to 0", () => {
		const state = createInitialState(["Alice", "Bob"], 8);
		const after1 = advancePlayer(state);
		const after2 = advancePlayer(after1);
		expect(after2.currentPlayerIndex).toBe(0);
	});
});
