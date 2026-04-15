import type { Card, RNG } from "types";
import { getGenreNames } from "./data";
import { invariant } from "./invariant";

export function shuffle<T>(array: T[], rng: RNG = Math.random): T[] {
	const out = [...array];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const a = out[i];
		const b = out[j];
		invariant(a !== undefined, `shuffle: index ${i} out of bounds`);
		invariant(b !== undefined, `shuffle: index ${j} out of bounds`);
		out[i] = b;
		out[j] = a;
	}
	return out;
}

function buildDeck(): Card[] {
	const genreCards: Card[] = getGenreNames().map((name) => ({
		type: "genre",
		genre: name,
		label: name,
	}));

	// SPECIAL_CARD_COUNT = 5: 1 loseATurn + 2 playerChooses + 2 opponentChooses
	const specials: Card[] = [
		{ type: "loseATurn", genre: null, label: "Lose a Turn" },
		{ type: "playerChooses", genre: null, label: "Player Chooses" },
		{ type: "playerChooses", genre: null, label: "Player Chooses" },
		{ type: "opponentChooses", genre: null, label: "Opponent Chooses" },
		{ type: "opponentChooses", genre: null, label: "Opponent Chooses" },
	];

	return [...genreCards, ...specials];
}

export function createDeck(rng: RNG = Math.random): Card[] {
	return shuffle(buildDeck(), rng);
}

export function drawCard(
	deck: Card[],
	rng: RNG = Math.random,
): { card: Card; remaining: Card[]; reshuffled: boolean } {
	if (deck.length === 0) {
		const fresh = createDeck(rng);
		const card = fresh[0];
		invariant(card, "Freshly created deck must not be empty");
		return { card, remaining: fresh.slice(1), reshuffled: true };
	}
	const card = deck[0];
	invariant(card, "Deck was non-empty but deck[0] was undefined");
	return { card, remaining: deck.slice(1), reshuffled: false };
}
