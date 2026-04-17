export type RNG = () => number;

export type CardType =
	| "genre"
	| "loseATurn"
	| "playerChooses"
	| "opponentChooses";

export type Card = {
	type: CardType;
	genre: string | null; // non-null only for "genre" type cards
	label: string;
};

export type Entry = {
	openingLines: string;
	title: string;
	author: string;
	year: number;
};

export type GenreData = {
	name: string;
	entries: Entry[];
};

export type GamePhase =
	| "setup"
	| "draw"
	| "loseATurn"
	| "genreSelect"
	| "prompt"
	| "judge"
	| "gameOver";

export type GenreResult = { correct: number; incorrect: number };

export type PlayerStats = {
	correct: number;
	incorrect: number;
	currentStreak: number;
	bestStreak: number;
	genreResults: Record<string, GenreResult>;
};

export type Player = {
	name: string;
	score: number;
	stats: PlayerStats;
};

export type GameState = {
	phase: GamePhase;
	players: Player[];
	currentPlayerIndex: number;
	targetScore: number;
	deck: Card[];
	deckDrawCount: number; // cards drawn from current cycle, resets on reshuffle
	currentCard: Card | null;
	currentEntry: Entry | null;
	currentGenre: string | null;
	usedEntries: Record<string, number[]>;
};

// Versioned wrapper for localStorage -- bump version when GameState shape changes
// and update the migration in loadState().
export type PersistedState = {
	version: 3;
	state: GameState;
};

export const STORAGE_VERSION = 3 as const;
export const TARGET_SCORE_OPTIONS = [5, 8, 10, 15] as const;
export const DEFAULT_TARGET_SCORE = 8;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
// DECK_SIZE is not a constant -- it equals getGenreNames().length + 5 (the 5 specials).
// Adding a genre JSON file automatically increases the deck. No hardcoded count.
export const SPECIAL_CARD_COUNT = 5;
