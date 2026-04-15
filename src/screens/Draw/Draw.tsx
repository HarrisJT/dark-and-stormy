import { useState } from "react";
import { getCurrentPlayer } from "state/transitions";
import type { GameState } from "types";
import styles from "./Draw.module.css";

type Props = {
	state: GameState;
	onDraw: () => void;
	deckSize: number;
};

export default function Draw({ state, onDraw, deckSize }: Props) {
	const [drawing, setDrawing] = useState(false);
	const currentPlayer = getCurrentPlayer(state);

	function handleDraw() {
		setDrawing(true);
		setTimeout(onDraw, 350);
	}

	return (
		<div className={styles.draw}>
			<div className={styles.turnLabel}>{currentPlayer.name}'s Turn</div>

			<div className={styles.drawArea}>
				<button
					type="button"
					className={`${styles.drawBtn}${drawing ? ` ${styles.drawing}` : ""}`}
					onClick={handleDraw}
					disabled={drawing}
				>
					<span className={styles.drawLabel}>Draw Genre</span>
				</button>
			</div>

			<div className={styles.deckCounter}>
				Card {state.deckDrawCount} of {deckSize}
			</div>

			<div className={styles.scoreboard}>
				{state.players.map((player, i) => (
					<div
						key={player.name}
						className={styles.scoreRow}
						data-active={i === state.currentPlayerIndex}
					>
						<span className={styles.playerName}>{player.name}</span>
						<span className={styles.playerScore}>
							{player.score} / {state.targetScore}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
