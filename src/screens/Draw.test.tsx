import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import Draw from "./Draw";

const baseState: GameState = {
	phase: "draw",
	players: [{ name: "Alice", score: 3 }, { name: "Bob", score: 5 }],
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

	it("calls onDraw when the button is clicked", async () => {
		const user = userEvent.setup();
		const onDraw = vi.fn();
		render(<Draw state={baseState} onDraw={onDraw} deckSize={17} />);
		await user.click(screen.getByRole("button", { name: /Draw Card/i }));
		expect(onDraw).toHaveBeenCalledOnce();
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
