import { allGenres } from "logic/data";
import { describe, expect, it } from "vitest";
import { gameReducer } from "./reducer";

const genres = allGenres;
const twoPlayers = ["Alice", "Bob"];

const mockEntry = {
	openingLines: "It was...",
	title: "Test Book",
	author: "Author",
	year: 2000,
};

function startedState() {
	const s = gameReducer(null, {
		type: "START_GAME",
		names: twoPlayers,
		targetScore: 8,
	});
	if (!s) throw new Error("START_GAME returned null");
	return s;
}

// States that require non-null currentEntry/currentGenre (enforced by assertTransition).
function promptState() {
	return {
		...startedState(),
		phase: "prompt" as const,
		currentEntry: mockEntry,
		currentGenre: "Poetry",
	};
}

function judgeState() {
	return {
		...startedState(),
		phase: "judge" as const,
		currentEntry: mockEntry,
		currentGenre: "Poetry",
	};
}

describe("START_GAME", () => {
	it("creates state with draw phase", () => {
		const s = startedState();
		expect(s.phase).toBe("draw");
	});

	it("initializes players with zero scores", () => {
		const s = startedState();
		expect(s.players).toHaveLength(2);
		for (const p of s.players) expect(p.score).toBe(0);
	});

	it("creates a full deck (genre count + 5 specials)", () => {
		const s = startedState();
		expect(s.deck).toHaveLength(genres.length + 5);
	});
});

describe("DRAW", () => {
	it("transitions to genreSelect for playerChooses / opponentChooses cards", () => {
		const s = startedState();
		const stateWithSpecial = {
			...s,
			deck: [
				{
					type: "playerChooses" as const,
					genre: null,
					label: "Player Chooses",
				},
				...s.deck,
			],
		};
		const next = gameReducer(stateWithSpecial, { type: "DRAW" });
		expect(next?.phase).toBe("genreSelect");
	});

	it("transitions to loseATurn for loseATurn card", () => {
		const s = startedState();
		const stateWithLose = {
			...s,
			deck: [
				{ type: "loseATurn" as const, genre: null, label: "Lose a Turn" },
				...s.deck,
			],
		};
		const next = gameReducer(stateWithLose, { type: "DRAW" });
		expect(next?.phase).toBe("loseATurn");
	});

	it("transitions to prompt for a genre card", () => {
		const s = startedState();
		const genreCard = {
			type: "genre" as const,
			genre: genres[0]?.name ?? "Poetry",
			label: genres[0]?.name ?? "Poetry",
		};
		const stateWithGenre = { ...s, deck: [genreCard, ...s.deck] };
		const next = gameReducer(stateWithGenre, { type: "DRAW" });
		expect(next?.phase).toBe("prompt");
	});

	it("increments deckDrawCount on each draw", () => {
		const s = startedState();
		const after = gameReducer(s, { type: "DRAW" });
		expect(after?.deckDrawCount).toBe(1);
	});
});

describe("CONTINUE_LOSE_A_TURN", () => {
	it("advances to next player in draw phase", () => {
		const s = {
			...startedState(),
			phase: "loseATurn" as const,
			currentPlayerIndex: 0,
		};
		const next = gameReducer(s, { type: "CONTINUE_LOSE_A_TURN" });
		expect(next?.phase).toBe("draw");
		expect(next?.currentPlayerIndex).toBe(1);
	});
});

describe("SELECT_GENRE", () => {
	it("sets currentGenre and transitions to prompt", () => {
		const s = { ...startedState(), phase: "genreSelect" as const };
		const next = gameReducer(s, {
			type: "SELECT_GENRE",
			genre: genres[0]?.name ?? "Poetry",
		});
		expect(next?.phase).toBe("prompt");
		expect(next?.currentGenre).toBe(genres[0]?.name ?? "Poetry");
		expect(next?.currentEntry).not.toBeNull();
	});
});

describe("PASS_TO_JUDGE", () => {
	it("transitions to judge phase", () => {
		const next = gameReducer(promptState(), { type: "PASS_TO_JUDGE" });
		expect(next?.phase).toBe("judge");
	});

	it("throws when called outside prompt phase", () => {
		expect(() =>
			gameReducer(startedState(), { type: "PASS_TO_JUDGE" }),
		).toThrow(/prompt/);
	});
});

describe("JUDGE", () => {
	it("advances player on incorrect", () => {
		const next = gameReducer(judgeState(), { type: "JUDGE", correct: false });
		expect(next?.phase).toBe("draw");
		expect(next?.players[0]?.score).toBe(0);
	});

	it("awards a point on correct", () => {
		const next = gameReducer(
			{ ...judgeState(), currentPlayerIndex: 0 },
			{ type: "JUDGE", correct: true },
		);
		expect(next?.players[0]?.score).toBe(1);
	});

	it("transitions to gameOver when target reached", () => {
		const next = gameReducer(
			{ ...judgeState(), currentPlayerIndex: 0, targetScore: 1 },
			{ type: "JUDGE", correct: true },
		);
		expect(next?.phase).toBe("gameOver");
	});

	it("throws when called outside judge phase", () => {
		expect(() =>
			gameReducer(startedState(), { type: "JUDGE", correct: true }),
		).toThrow(/judge/);
	});
});

describe("NEW_GAME", () => {
	it("returns null", () => {
		expect(gameReducer(startedState(), { type: "NEW_GAME" })).toBeNull();
	});
});

describe("PLAY_AGAIN", () => {
	it("resets to draw phase with same players", () => {
		const s = { ...startedState(), phase: "gameOver" as const };
		const next = gameReducer(s, { type: "PLAY_AGAIN" });
		expect(next?.phase).toBe("draw");
		expect(next?.players).toHaveLength(2);
		for (const p of next!.players) expect(p.score).toBe(0);
	});
});
