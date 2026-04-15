import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearSavedState, saveState } from "logic/storage";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
	clearSavedState();
});

describe("App", () => {
	it("renders the setup screen by default", () => {
		render(<App />);
		expect(
			screen.getByText(/It Was a Dark and Stormy Night/i),
		).toBeInTheDocument();
	});

	it("transitions to draw phase after starting a game", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(screen.getByText(/Draw Genre/i)).toBeInTheDocument();
	});

	it("shows New Game button during play", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(
			screen.getByRole("button", { name: /New Game/i }),
		).toBeInTheDocument();
	});

	it("returns to setup when New Game is clicked", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		await user.click(screen.getByRole("button", { name: /New Game/i }));
		expect(
			screen.getByText(/It Was a Dark and Stormy Night/i),
		).toBeInTheDocument();
	});

	it("does not resume a gameOver state on reload -- shows setup instead", () => {
		saveState({
			phase: "gameOver",
			players: [
				{ name: "Alice", score: 8 },
				{ name: "Bob", score: 3 },
			],
			currentPlayerIndex: 0,
			targetScore: 8,
			deck: [],
			deckDrawCount: 0,
			currentCard: null,
			currentEntry: null,
			currentGenre: null,
			usedEntries: {},
		});
		render(<App />);
		expect(
			screen.getByText(/It Was a Dark and Stormy Night/i),
		).toBeInTheDocument();
	});

	it("resumes a mid-game state on reload", () => {
		saveState({
			phase: "draw",
			players: [
				{ name: "Alice", score: 2 },
				{ name: "Bob", score: 1 },
			],
			currentPlayerIndex: 0,
			targetScore: 8,
			deck: [],
			deckDrawCount: 3,
			currentCard: null,
			currentEntry: null,
			currentGenre: null,
			usedEntries: {},
		});
		render(<App />);
		expect(screen.getByText(/Draw Genre/i)).toBeInTheDocument();
	});
});
