import type { GameState } from "types";

type Props = { state: GameState; onJudge: (correct: boolean) => void };

export default function Judge({ onJudge }: Props) {
	return <div><button type="button" onClick={() => onJudge(true)}>Correct</button></div>;
}
