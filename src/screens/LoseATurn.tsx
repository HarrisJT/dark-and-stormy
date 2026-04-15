import type { GameState } from "types";

type Props = { state: GameState; onContinue: () => void };

export default function LoseATurn({ onContinue }: Props) {
	return <div><button type="button" onClick={onContinue}>Continue</button></div>;
}
