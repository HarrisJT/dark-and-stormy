import type { GameState } from "types";
import styles from "./GameOver.module.css";

type Props = {
	state: GameState;
	onPlayAgain: () => void;
	onNewGame: () => void;
};

export default function GameOver({ state, onPlayAgain, onNewGame }: Props) {
	const sorted = [...state.players].sort((a, b) => b.score - a.score);
	const winner = sorted[0]!;

	return (
		<div className={styles.gameOver}>
			<div className={styles.winnerLabel}>Winner!</div>
			<div className={styles.winnerName}>{winner.name}</div>

			<div className={styles.scores}>
				{sorted.map((player) => (
					<div key={player.name} className={styles.scoreRow}>
						<span>{player.name}</span>
						<span>{player.score} pts</span>
					</div>
				))}
			</div>

			<button
				type="button"
				className={styles.playAgainBtn}
				onClick={onPlayAgain}
			>
				Play Again
			</button>
			<button type="button" className={styles.newGameBtn} onClick={onNewGame}>
				New Game
			</button>
		</div>
	);
}
