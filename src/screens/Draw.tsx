import type { GameState } from "types";

type Props = { state: GameState; onDraw: () => void; deckSize: number };

export default function Draw({ onDraw }: Props) {
	return (
		<div>
			<button type="button" onClick={onDraw}>Draw Card</button>
		</div>
	);
}
