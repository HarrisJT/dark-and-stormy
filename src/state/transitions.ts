import { invariant } from "logic/invariant";
import type { GamePhase, GameState, Player } from "types";

// Which nullable fields must be non-null in each phase.
// This is the single source of truth for the state model.
// When you add a new phase or field, update this table.
const REQUIRED_FIELDS_BY_PHASE: Record<
	GamePhase,
	("currentCard" | "currentEntry" | "currentGenre")[]
> = {
	setup: [],
	draw: [],
	loseATurn: [],
	genreSelect: [],
	prompt: ["currentEntry", "currentGenre"],
	judge: ["currentEntry", "currentGenre"],
	gameOver: [],
};

// Asserts that the state is in one of the expected phases and that all
// required nullable fields for that phase are non-null.
// Call this at the top of every reducer case before reading state fields.
export function assertTransition(
	state: GameState,
	expectedPhase: GamePhase | GamePhase[],
	action: string,
): asserts state is GameState {
	const phases = Array.isArray(expectedPhase) ? expectedPhase : [expectedPhase];
	invariant(
		phases.includes(state.phase),
		`${action}: expected phase ${phases.join(" | ")}, got "${state.phase}"`,
	);
	const required = REQUIRED_FIELDS_BY_PHASE[state.phase];
	for (const field of required) {
		invariant(
			state[field] !== null,
			`${action}: ${field} must not be null in "${state.phase}" phase`,
		);
	}
}

// Returns the player whose turn it currently is.
// Centralizes the one critical index assumption: currentPlayerIndex is always valid.
export function getCurrentPlayer(state: GameState): Player {
	const player = state.players[state.currentPlayerIndex];
	invariant(
		player,
		`getCurrentPlayer: currentPlayerIndex ${state.currentPlayerIndex} out of bounds (${state.players.length} players)`,
	);
	return player;
}
