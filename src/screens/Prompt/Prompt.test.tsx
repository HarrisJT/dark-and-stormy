import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameState } from "types";
import { describe, expect, it, vi } from "vitest";
import Prompt from "./Prompt";

const baseState: GameState = {
	phase: "prompt",
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
	deckDrawCount: 2,
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

describe("Prompt", () => {
	it("shows genre and pass instruction before judge is ready", () => {
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		expect(screen.getByText("Poetry")).toBeInTheDocument();
		expect(screen.getByText(/Pass the phone/i)).toBeInTheDocument();
		expect(screen.queryByText(/April is the cruellest month/i)).toBeNull();
	});

	it("shows Continue button before judge is ready", () => {
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: /Continue/i }),
		).toBeInTheDocument();
	});

	it("reveals opening line after Continue is tapped", async () => {
		const user = userEvent.setup();
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(
			screen.getByText(/April is the cruellest month/i),
		).toBeInTheDocument();
	});

	it("names the player in the instruction after reveal", async () => {
		const user = userEvent.setup();
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(screen.getByText(/Alice guesses/i)).toBeInTheDocument();
	});

	it("calls onPassToJudge when Reveal Answer is clicked", async () => {
		const user = userEvent.setup();
		const onPassToJudge = vi.fn();
		render(<Prompt state={baseState} onPassToJudge={onPassToJudge} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		await user.click(screen.getByRole("button", { name: /Reveal Answer/i }));
		expect(onPassToJudge).toHaveBeenCalledOnce();
	});
});
