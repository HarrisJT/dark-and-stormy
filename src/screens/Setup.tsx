import { useState } from "react";
import {
	DEFAULT_TARGET_SCORE,
	MAX_PLAYERS,
	MIN_PLAYERS,
	TARGET_SCORE_OPTIONS,
} from "types";
import styles from "./Setup.module.css";

type Props = {
	onStart: (names: string[], targetScore: number) => void;
};

export default function Setup({ onStart }: Props) {
	const [names, setNames] = useState<string[]>(["Player 1", "Player 2"]);
	const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE);

	const updateName = (i: number, value: string) =>
		setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));

	const addPlayer = () => {
		if (names.length >= MAX_PLAYERS) return;
		setNames((prev) => [...prev, `Player ${prev.length + 1}`]);
	};

	const removePlayer = (i: number) => {
		if (names.length <= MIN_PLAYERS) return;
		setNames((prev) => prev.filter((_, idx) => idx !== i));
	};

	const handleStart = () => {
		const resolved = names.map((n, i) => n.trim() || `Player ${i + 1}`);
		onStart(resolved, targetScore);
	};

	return (
		<div className={styles.setup}>
			<div>
				<h1 className={styles.heading}>It Was a Dark and Stormy Night</h1>
				<p className={styles.subtitle}>A literary trivia game</p>
			</div>

			<div className={styles.section}>
				<span className={styles.label}>Players</span>
				{names.map((name, i) => (
					<div key={i} className={styles.playerRow}>
						<input
							className={styles.playerInput}
							placeholder={`Player ${i + 1}`}
							value={name}
							onChange={(e) => updateName(i, e.target.value)}
						/>
						{names.length > MIN_PLAYERS && (
							<button
								type="button"
								aria-label={`Remove player ${i + 1}`}
								className={styles.removeBtn}
								onClick={() => removePlayer(i)}
							>
								×
							</button>
						)}
					</div>
				))}
				{names.length < MAX_PLAYERS && (
					<button type="button" className={styles.addBtn} onClick={addPlayer}>
						+ Add Player
					</button>
				)}
			</div>

			<div className={styles.section}>
				<span className={styles.label}>First to</span>
				<div className={styles.scoreOptions}>
					{TARGET_SCORE_OPTIONS.map((opt) => (
						<button
							key={opt}
							type="button"
							className={styles.scoreBtn}
							data-active={opt === targetScore}
							onClick={() => setTargetScore(opt)}
						>
							{opt}
						</button>
					))}
				</div>
			</div>

			<button type="button" className={styles.startBtn} onClick={handleStart}>
				Start Game
			</button>
		</div>
	);
}
