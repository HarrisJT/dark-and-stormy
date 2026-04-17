import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameState } from "types";
import { describe, expect, it, vi } from "vitest";
import GameOver from "./GameOver";

const baseState: GameState = {
	phase: "gameOver",
	players: [
		{
			name: "Alice",
			score: 8,
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
			score: 5,
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
	deckDrawCount: 17,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("GameOver", () => {
	it("shows the winner's name", () => {
		render(
			<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />,
		);
		expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
		expect(screen.getByText("Winner!")).toBeInTheDocument();
	});

	it("lists all players sorted by score", () => {
		render(
			<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />,
		);
		const rows = screen.getAllByText(/pts/);
		expect(rows[0]!.textContent).toBe("8 pts");
		expect(rows[1]!.textContent).toBe("5 pts");
	});

	it("shows rounds, margin, accuracy, best streak, favorite and worst genre", () => {
		const state: GameState = {
			...baseState,
			players: [
				{
					name: "Alice",
					score: 8,
					stats: {
						correct: 8,
						incorrect: 2,
						currentStreak: 0,
						bestStreak: 4,
						genreResults: {
							Poetry: { correct: 6, incorrect: 0 },
							Mysteries: { correct: 2, incorrect: 2 },
						},
					},
				},
				{
					name: "Bob",
					score: 5,
					stats: {
						correct: 5,
						incorrect: 5,
						currentStreak: 0,
						bestStreak: 2,
						genreResults: {
							Shakespeare: { correct: 5, incorrect: 5 },
						},
					},
				},
			],
		};
		render(
			<GameOver state={state} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />,
		);
		expect(screen.getByText("20")).toBeInTheDocument();
		expect(screen.getByText("+3")).toBeInTheDocument();
		expect(screen.getByText("80%")).toBeInTheDocument();
		expect(screen.getAllByText("Accuracy").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Best streak").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Favorite genre").length).toBeGreaterThan(0);
		expect(screen.getByText("Poetry")).toBeInTheDocument();
		expect(screen.getByText("Mysteries")).toBeInTheDocument();
		expect(screen.getByText("Worst genre")).toBeInTheDocument();
		expect(screen.getByText("Shakespeare")).toBeInTheDocument();
	});

	it("calls onPlayAgain when Play Again is clicked", async () => {
		const user = userEvent.setup();
		const onPlayAgain = vi.fn();
		render(
			<GameOver
				state={baseState}
				onPlayAgain={onPlayAgain}
				onNewGame={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Play Again/i }));
		expect(onPlayAgain).toHaveBeenCalledOnce();
	});

	it("calls onNewGame when New Game is clicked", async () => {
		const user = userEvent.setup();
		const onNewGame = vi.fn();
		render(
			<GameOver
				state={baseState}
				onPlayAgain={vi.fn()}
				onNewGame={onNewGame}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /New Game/i }));
		expect(onNewGame).toHaveBeenCalledOnce();
	});
});
