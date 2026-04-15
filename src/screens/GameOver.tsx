import type { GameState } from "types";

type Props = { state: GameState; onPlayAgain: () => void; onNewGame: () => void };

export default function GameOver({ onPlayAgain, onNewGame }: Props) {
	return <div><button type="button" onClick={onPlayAgain}>Play Again</button><button type="button" onClick={onNewGame}>New Game</button></div>;
}
