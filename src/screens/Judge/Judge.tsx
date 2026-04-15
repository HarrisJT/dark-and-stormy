import { invariant } from "logic/invariant";
import { getCurrentPlayer } from "state/transitions";
import type { GameState } from "types";
import styles from "./Judge.module.css";

type Props = {
	state: GameState;
	onJudge: (correct: boolean) => void;
};

export default function Judge({ state, onJudge }: Props) {
	const { currentEntry, currentGenre } = state;
	invariant(currentEntry, "Judge rendered without currentEntry");

	const player = getCurrentPlayer(state);
	const points = 1;

	return (
		<div className={styles.judge}>
			<div className={styles.genre}>{currentGenre}</div>

			<div className="openingLines">{currentEntry.openingLines}</div>

			<div className={styles.answer}>
				<div className={styles.answerTitle}>{currentEntry.title}</div>
				<div className={styles.answerAuthor}>by {currentEntry.author}</div>
				<div className={styles.answerYear}>{currentEntry.year}</div>
			</div>

			<div className={styles.question}>
				Did {player.name} get it? ({points} {points === 1 ? "point" : "points"})
			</div>

			<div className={styles.buttons}>
				<button
					type="button"
					className={styles.correctBtn}
					onClick={() => onJudge(true)}
				>
					Correct
				</button>
				<button
					type="button"
					className={styles.incorrectBtn}
					onClick={() => onJudge(false)}
				>
					Incorrect
				</button>
			</div>
		</div>
	);
}
