import { fireEvent, render, screen } from "@testing-library/react";
import type { GameState } from "types";
import { describe, expect, it, vi } from "vitest";
import Draw from "./Draw";

const baseState: GameState = {
	phase: "draw",
	players: [
		{
			name: "Alice",
			score: 3,
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
	deckDrawCount: 5,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("Draw", () => {
	it("shows whose turn it is", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
	});

	it("calls onDraw after the animation delay", () => {
		vi.useFakeTimers();
		const onDraw = vi.fn();
		render(<Draw state={baseState} onDraw={onDraw} deckSize={17} />);
		fireEvent.click(screen.getByRole("button", { name: /Draw Genre/i }));
		expect(onDraw).not.toHaveBeenCalled();
		vi.runAllTimers();
		expect(onDraw).toHaveBeenCalledOnce();
		vi.useRealTimers();
	});

	it("renders all players in the scoreboard", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
	});

	it("shows scores and target", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText("3 / 8")).toBeInTheDocument();
		expect(screen.getByText("5 / 8")).toBeInTheDocument();
	});

	it("shows the card counter", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText(/Card 5 of 17/i)).toBeInTheDocument();
	});
});
