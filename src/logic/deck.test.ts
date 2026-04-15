import type { RNG } from "types";
import { describe, expect, it } from "vitest";
import { loadGenres } from "./data";
import { createDeck, drawCard } from "./deck";

// Tests must be resilient to adding/removing JSON files in src/data/.
// Do not hardcode the number of genre cards; derive it from discovered genres.

// Deterministic RNG: always returns 0 so shuffle leaves array in original order.
const deterministicRng: RNG = () => 0;

describe("createDeck", () => {
	it("creates one genre card per discovered genre", () => {
		const genres = loadGenres();
		const deck = createDeck(deterministicRng);
		const genreCards = deck.filter((c) => c.type === "genre");
		expect(genreCards).toHaveLength(genres.length);
	});

	it("total deck size equals (genre count + 5 specials)", () => {
		const genres = loadGenres();
		const deck = createDeck(deterministicRng);
		expect(deck).toHaveLength(genres.length + 5);
	});

	it("contains the expected special card counts", () => {
		const deck = createDeck(deterministicRng);
		expect(deck.filter((c) => c.type === "loseATurn")).toHaveLength(1);
		expect(deck.filter((c) => c.type === "guesserChooses")).toHaveLength(2);
		expect(deck.filter((c) => c.type === "opponentChooses")).toHaveLength(2);
	});
});

describe("drawCard", () => {
	it("returns the top card and the remaining deck", () => {
		const deck = createDeck(deterministicRng);
		const first = deck[0];
		const { card, remaining, reshuffled } = drawCard(deck, deterministicRng);
		expect(card).toEqual(first);
		expect(remaining.length).toBe(deck.length - 1);
		expect(reshuffled).toBe(false);
	});

	it("reshuffles when deck is empty", () => {
		const { card, remaining, reshuffled } = drawCard([], deterministicRng);
		expect(card).toBeDefined();
		expect(remaining.length).toBeGreaterThan(0);
		expect(reshuffled).toBe(true);
	});
});
