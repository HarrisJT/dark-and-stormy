import type { GameState } from "types";

type Props = { state: GameState; onPassToJudge: () => void };

export default function Prompt({ onPassToJudge }: Props) {
	return <div><button type="button" onClick={onPassToJudge}>Pass to Judge</button></div>;
}
