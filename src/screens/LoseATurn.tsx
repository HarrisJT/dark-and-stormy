import { getCurrentPlayer } from "state/transitions";
import type { GameState } from "types";
import styles from "./LoseATurn.module.css";

type Props = {
	state: GameState;
	onContinue: () => void;
};

export default function LoseATurn({ state, onContinue }: Props) {
	const player = getCurrentPlayer(state);

	return (
		<div className={styles.loseATurn}>
			<div className={styles.heading}>Lose a Turn!</div>
			<div className={styles.message}>{player.name} is skipped.</div>
			<button type="button" className={styles.continueBtn} onClick={onContinue}>
				Continue
			</button>
		</div>
	);
}
