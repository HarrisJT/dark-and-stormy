import { useState } from "react";
import { getCurrentPlayer } from "state/transitions";
import type { GameState } from "types";
import styles from "./Prompt.module.css";

type Props = {
	state: GameState;
	onPassToJudge: () => void;
};

export default function Prompt({ state, onPassToJudge }: Props) {
	const { currentEntry, currentGenre } = state;
	const [judgeReady, setJudgeReady] = useState(false);

	if (!currentEntry) return null;

	const guesser = getCurrentPlayer(state);

	if (!judgeReady) {
		return (
			<div className={styles.prompt}>
				<div className={styles.genre}>{currentGenre}</div>
				<div className={styles.passInstruction}>
					Pass the phone to a judge, then tap Continue.
				</div>
				<button
					type="button"
					className={styles.continueBtn}
					onClick={() => setJudgeReady(true)}
				>
					Continue
				</button>
			</div>
		);
	}

	return (
		<div className={styles.prompt}>
			<div className={styles.genre}>{currentGenre}</div>

			<div className={styles.openingLines}>{currentEntry.openingLines}</div>

			<div className={styles.instruction}>
				Read aloud. {guesser.name} guesses title, author, or year.
			</div>

			<button type="button" className={styles.revealBtn} onClick={onPassToJudge}>
				Reveal Answer
			</button>
		</div>
	);
}
