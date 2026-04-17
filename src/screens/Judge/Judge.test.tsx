import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameState } from "types";
import { describe, expect, it, vi } from "vitest";
import Judge from "./Judge";

const baseState: GameState = {
	phase: "judge",
	players: [
		{
			name: "Alice",
			score: 0,
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
			score: 0,
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
	deckDrawCount: 4,
	currentCard: { type: "genre", genre: "Poetry", label: "Poetry" },
	currentEntry: {
		openingLines: "April is the cruellest month",
		title: "The Waste Land",
		author: "T.S. Eliot",
		year: 1922,
	},
	currentGenre: "Poetry",
	usedEntries: {},
};

describe("Judge", () => {
	it("shows the opening lines, title, author, and year", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(
			screen.getByText("April is the cruellest month"),
		).toBeInTheDocument();
		expect(screen.getByText("The Waste Land")).toBeInTheDocument();
		expect(screen.getByText(/T.S. Eliot/i)).toBeInTheDocument();
		expect(screen.getByText("1922")).toBeInTheDocument();
	});

	it("names the player in the question", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(screen.getByText(/Alice/i)).toBeInTheDocument();
	});

	it("calls onJudge(true) when Correct is clicked", async () => {
		const user = userEvent.setup();
		const onJudge = vi.fn();
		render(<Judge state={baseState} onJudge={onJudge} />);
		await user.click(screen.getByRole("button", { name: /^Correct$/i }));
		expect(onJudge).toHaveBeenCalledWith(true);
	});

	it("calls onJudge(false) when Incorrect is clicked", async () => {
		const user = userEvent.setup();
		const onJudge = vi.fn();
		render(<Judge state={baseState} onJudge={onJudge} />);
		await user.click(screen.getByRole("button", { name: /Incorrect/i }));
		expect(onJudge).toHaveBeenCalledWith(false);
	});

	it("shows 1 point", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(screen.getByText(/1 point/i)).toBeInTheDocument();
	});
});
