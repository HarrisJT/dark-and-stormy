import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameState } from "types";
import { describe, expect, it, vi } from "vitest";
import LoseATurn from "./LoseATurn";

const baseState: GameState = {
	phase: "loseATurn",
	players: [
		{ name: "Alice", score: 2 },
		{ name: "Bob", score: 1 },
	],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: { type: "loseATurn", genre: null, label: "Lose a Turn" },
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("LoseATurn", () => {
	it("shows the skipped player's name", () => {
		render(<LoseATurn state={baseState} onContinue={vi.fn()} />);
		expect(screen.getByText(/Alice is skipped/i)).toBeInTheDocument();
	});

	it("shows Lose a Turn heading", () => {
		render(<LoseATurn state={baseState} onContinue={vi.fn()} />);
		expect(screen.getByText(/Lose a Turn/i)).toBeInTheDocument();
	});

	it("calls onContinue when Continue is clicked", async () => {
		const user = userEvent.setup();
		const onContinue = vi.fn();
		render(<LoseATurn state={baseState} onContinue={onContinue} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(onContinue).toHaveBeenCalledOnce();
	});
});
