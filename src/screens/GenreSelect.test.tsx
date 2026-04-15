import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameState, GenreData } from "types";
import { describe, expect, it, vi } from "vitest";
import GenreSelect from "./GenreSelect";

const testGenres: GenreData[] = [
	{ name: "Poetry", entries: [] },
	{ name: "Mysteries", entries: [] },
];

const baseState: GameState = {
	phase: "genreSelect",
	players: [
		{ name: "Alice", score: 0 },
		{ name: "Bob", score: 0 },
	],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: {
		type: "guesserChooses",
		genre: null,
		label: "Guesser Chooses",
	},
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("GenreSelect", () => {
	it("renders a button for each genre", () => {
		render(
			<GenreSelect state={baseState} genres={testGenres} onSelect={vi.fn()} />,
		);
		expect(screen.getByRole("button", { name: "Poetry" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Mysteries" }),
		).toBeInTheDocument();
	});

	it("calls onSelect with the genre name when clicked", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(
			<GenreSelect state={baseState} genres={testGenres} onSelect={onSelect} />,
		);
		await user.click(screen.getByRole("button", { name: "Poetry" }));
		expect(onSelect).toHaveBeenCalledWith("Poetry");
	});

	it("shows the guesser's name as picker for guesserChooses", () => {
		render(
			<GenreSelect state={baseState} genres={testGenres} onSelect={vi.fn()} />,
		);
		expect(screen.getByText(/Alice, pick a genre/i)).toBeInTheDocument();
	});

	it("shows the next player as picker for opponentChooses", () => {
		const state = {
			...baseState,
			currentCard: {
				type: "opponentChooses" as const,
				genre: null,
				label: "Opponent Chooses",
			},
		};
		render(
			<GenreSelect state={state} genres={testGenres} onSelect={vi.fn()} />,
		);
		expect(
			screen.getByText(/Bob, pick a genre for Alice/i),
		).toBeInTheDocument();
	});
});
