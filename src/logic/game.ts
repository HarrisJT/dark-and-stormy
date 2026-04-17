import type { GameState, Player, PlayerStats, RNG } from "types";
import { MIN_PLAYERS } from "types";
import { createDeck, shuffle } from "./deck";
import { invariant } from "./invariant";

export function emptyStats(): PlayerStats {
	return {
		correct: 0,
		incorrect: 0,
		currentStreak: 0,
		bestStreak: 0,
		genreResults: {},
	};
}

export function makePlayer(name: string, score = 0): Player {
	return { name, score, stats: emptyStats() };
}

export function createInitialState(
	names: string[],
	targetScore: number,
	rng: RNG = Math.random,
): GameState {
	invariant(
		names.length >= MIN_PLAYERS,
		`createInitialState: need at least ${MIN_PLAYERS} players, got ${names.length}`,
	);
	return {
		phase: "draw",
		players: shuffle(
			names.map((name) => makePlayer(name)),
			rng,
		),
		currentPlayerIndex: 0,
		targetScore,
		deck: createDeck(rng),
		deckDrawCount: 0,
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		usedEntries: {},
	};
}

export function getNextPlayerIndex(current: number, total: number): number {
	return (current + 1) % total;
}

export function applyScore(
	players: Player[],
	scorerIndex: number,
	points: number,
): Player[] {
	return players.map((p, i) =>
		i === scorerIndex ? { ...p, score: p.score + points } : p,
	);
}

export function checkWinner(
	players: Player[],
	targetScore: number,
): number | null {
	const idx = players.findIndex((p) => p.score >= targetScore);
	return idx === -1 ? null : idx;
}

export function advancePlayer(state: GameState): GameState {
	return {
		...state,
		phase: "draw",
		currentPlayerIndex: getNextPlayerIndex(
			state.currentPlayerIndex,
			state.players.length,
		),
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		// deckDrawCount persists across turns -- only resets when deck reshuffles
	};
}
