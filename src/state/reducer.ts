import { loadGenres } from "logic/data";
import { drawCard as drawCardFromDeck } from "logic/deck";
import { pickEntry } from "logic/entries";
import {
	advancePlayer,
	applyScore,
	checkWinner,
	createInitialState,
} from "logic/game";
import { invariant } from "logic/invariant";
import { makeSeededRng } from "logic/rng";
import type { GameState } from "types";
import { assertTransition } from "./transitions";

const allGenres = loadGenres();

export type Action =
	| { type: "START_GAME"; names: string[]; targetScore: number; seed?: number }
	| { type: "DRAW" }
	| { type: "CONTINUE_LOSE_A_TURN" }
	| { type: "SELECT_GENRE"; genre: string }
	| { type: "PASS_TO_JUDGE" }
	| { type: "JUDGE"; correct: boolean }
	| { type: "PLAY_AGAIN" }
	| { type: "NEW_GAME" };

export function gameReducer(
	state: GameState | null,
	action: Action,
): GameState | null {
	switch (action.type) {
		case "START_GAME": {
			const rng =
				action.seed !== undefined ? makeSeededRng(action.seed) : Math.random;
			return createInitialState(action.names, action.targetScore, rng);
		}

		case "DRAW": {
			if (!state) return null;
			assertTransition(state, "draw", "DRAW");
			const { card, remaining, reshuffled } = drawCardFromDeck(state.deck);
			const deckDrawCount = reshuffled ? 1 : state.deckDrawCount + 1;
			const base = {
				...state,
				deck: remaining,
				deckDrawCount,
				currentCard: card,
			};

			if (card.type === "loseATurn") return { ...base, phase: "loseATurn" };
			if (card.type === "guesserChooses" || card.type === "opponentChooses")
				return { ...base, phase: "genreSelect" };

			const genre = card.genre;
			invariant(genre, "Genre card must have a non-null genre");
			const { entry, usedEntries } = pickEntry(
				genre,
				allGenres,
				state.usedEntries,
			);
			return {
				...base,
				currentEntry: entry,
				currentGenre: genre,
				usedEntries,
				phase: "prompt",
			};
		}

		case "CONTINUE_LOSE_A_TURN":
			if (!state) return null;
			assertTransition(state, "loseATurn", "CONTINUE_LOSE_A_TURN");
			return advancePlayer(state);

		case "SELECT_GENRE": {
			if (!state) return null;
			assertTransition(state, "genreSelect", "SELECT_GENRE");
			const { entry, usedEntries } = pickEntry(
				action.genre,
				allGenres,
				state.usedEntries,
			);
			return {
				...state,
				currentEntry: entry,
				currentGenre: action.genre,
				usedEntries,
				phase: "prompt",
			};
		}

		case "PASS_TO_JUDGE":
			if (!state) return null;
			assertTransition(state, "prompt", "PASS_TO_JUDGE");
			// assertTransition already verified currentEntry/currentGenre are non-null
			return { ...state, phase: "judge" };

		case "JUDGE": {
			if (!state) return null;
			assertTransition(state, "judge", "JUDGE");
			if (!action.correct) return advancePlayer(state);
			const newPlayers = applyScore(state.players, state.currentPlayerIndex, 1);
			const winnerIdx = checkWinner(newPlayers, state.targetScore);
			if (winnerIdx !== null)
				return { ...state, players: newPlayers, phase: "gameOver" };
			return advancePlayer({ ...state, players: newPlayers });
		}

		case "PLAY_AGAIN": {
			if (!state) return null;
			assertTransition(state, "gameOver", "PLAY_AGAIN");
			// Always use real randomness -- the seed only applies to the first game.
			// To replay a seeded game, reload the page with ?seed=N.
			return createInitialState(
				state.players.map((p) => p.name),
				state.targetScore,
			);
		}

		case "NEW_GAME":
			return null;

		default:
			return state;
	}
}
