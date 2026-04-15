import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Setup from "./Setup";

describe("Setup", () => {
	it("renders title and subtitle", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(
			screen.getByText(/It Was a Dark and Stormy Night/i),
		).toBeInTheDocument();
		expect(screen.getByText(/literary trivia/i)).toBeInTheDocument();
	});

	it("starts with two player inputs", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
	});

	it("adds a player when + Add Player is clicked", async () => {
		const user = userEvent.setup();
		render(<Setup onStart={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Add Player/i }));
		expect(screen.getAllByRole("textbox")).toHaveLength(3);
	});

	it("removes a player when remove is clicked (keeps minimum 2)", async () => {
		const user = userEvent.setup();
		render(<Setup onStart={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Add Player/i }));
		const removeButtons = screen.getAllByRole("button", {
			name: /Remove player/i,
		});
		await user.click(removeButtons[0]!);
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
	});

	it("does not show remove buttons when only 2 players", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(screen.queryByRole("button", { name: /Remove player/i })).toBeNull();
	});

	it("calls onStart with resolved names and default target score", async () => {
		const user = userEvent.setup();
		const onStart = vi.fn();
		render(<Setup onStart={onStart} />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(onStart).toHaveBeenCalledWith(["Beck", "Harry"], 8);
	});

	it("uses trimmed names, falling back to Player N for empty inputs", async () => {
		const user = userEvent.setup();
		const onStart = vi.fn();
		render(<Setup onStart={onStart} />);
		const inputs = screen.getAllByRole("textbox");
		await user.clear(inputs[0]!);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(onStart).toHaveBeenCalledWith(["Player 1", "Harry"], 8);
	});
});
