import { invariant } from "logic/invariant";
import type { GameState } from "types";
import styles from "./Draw.module.css";

type Props = {
	state: GameState;
	onDraw: () => void;
	deckSize: number;
};

export default function Draw({ state, onDraw, deckSize }: Props) {
	const currentPlayer = state.players[state.currentPlayerIndex];
	invariant(currentPlayer, "currentPlayerIndex must point to a valid player");

	return (
		<div className={styles.draw}>
			<div className={styles.turnLabel}>{currentPlayer.name}'s Turn</div>

			<button type="button" className={styles.drawBtn} onClick={onDraw}>
				Draw Card
			</button>

			<div className={styles.deckCounter}>
				Card {state.deckDrawCount} of {deckSize}
			</div>

			<div className={styles.scoreboard}>
				{state.players.map((player, i) => (
					<div
						key={i}
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
