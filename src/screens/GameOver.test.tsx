import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import GameOver from "./GameOver";

const baseState: GameState = {
	phase: "gameOver",
	players: [{ name: "Alice", score: 8 }, { name: "Bob", score: 5 }],
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
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />);
		expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
		expect(screen.getByText("Winner!")).toBeInTheDocument();
	});

	it("lists all players sorted by score", () => {
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />);
		const rows = screen.getAllByText(/pts/);
		expect(rows[0]!.textContent).toBe("8 pts");
		expect(rows[1]!.textContent).toBe("5 pts");
	});

	it("calls onPlayAgain when Play Again is clicked", async () => {
		const user = userEvent.setup();
		const onPlayAgain = vi.fn();
		render(<GameOver state={baseState} onPlayAgain={onPlayAgain} onNewGame={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Play Again/i }));
		expect(onPlayAgain).toHaveBeenCalledOnce();
	});

	it("calls onNewGame when New Game is clicked", async () => {
		const user = userEvent.setup();
		const onNewGame = vi.fn();
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={onNewGame} />);
		await user.click(screen.getByRole("button", { name: /New Game/i }));
		expect(onNewGame).toHaveBeenCalledOnce();
	});
});
