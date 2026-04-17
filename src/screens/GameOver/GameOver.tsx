import { invariant } from "logic/invariant";
import type { GameState, Player } from "types";
import styles from "./GameOver.module.css";

type Props = {
	state: GameState;
	onPlayAgain: () => void;
	onNewGame: () => void;
};

function totalPlays(r: { correct: number; incorrect: number }) {
	return r.correct + r.incorrect;
}

function favoriteGenre(player: Player): string | null {
	const entries = Object.entries(player.stats.genreResults);
	if (entries.length === 0) return null;
	entries.sort((a, b) => totalPlays(b[1]) - totalPlays(a[1]));
	return entries[0]?.[0] ?? null;
}

function worstGenre(player: Player): string | null {
	// Genre with lowest accuracy, requiring at least one incorrect (otherwise
	// perfect-on-one-play genres would dominate). Ties broken by more plays.
	const entries = Object.entries(player.stats.genreResults).filter(
		([, r]) => r.incorrect > 0,
	);
	if (entries.length === 0) return null;
	entries.sort((a, b) => {
		const accA = a[1].correct / totalPlays(a[1]);
		const accB = b[1].correct / totalPlays(b[1]);
		if (accA !== accB) return accA - accB;
		return totalPlays(b[1]) - totalPlays(a[1]);
	});
	return entries[0]?.[0] ?? null;
}

function accuracy(player: Player): number | null {
	const { correct, incorrect } = player.stats;
	const total = correct + incorrect;
	if (total === 0) return null;
	return Math.round((correct / total) * 100);
}

export default function GameOver({ state, onPlayAgain, onNewGame }: Props) {
	const sorted = [...state.players].sort((a, b) => b.score - a.score);
	const winner = sorted[0];
	invariant(winner, "GameOver requires at least one player");

	const totalRounds = state.players.reduce(
		(sum, p) => sum + p.stats.correct + p.stats.incorrect,
		0,
	);
	const runnerUp = sorted[1];
	const margin = runnerUp ? winner.score - runnerUp.score : winner.score;

	return (
		<div className={styles.gameOver}>
			<div className={styles.winnerLabel}>Winner!</div>
			<div className={styles.winnerName}>{winner.name}</div>

			<div className={styles.summaryRow}>
				<div className={styles.summaryItem}>
					<div className={styles.summaryValue}>{totalRounds}</div>
					<div className={styles.summaryLabel}>Rounds</div>
				</div>
				<div className={styles.summaryItem}>
					<div className={styles.summaryValue}>
						{margin > 0 ? `+${margin}` : margin}
					</div>
					<div className={styles.summaryLabel}>Margin</div>
				</div>
			</div>

			<div className={styles.scores}>
				{sorted.map((player, i) => {
					const acc = accuracy(player);
					const fav = favoriteGenre(player);
					const worst = worstGenre(player);
					const best = player.stats.bestStreak;
					return (
						<div key={player.name} className={styles.scoreRow}>
							<div className={styles.scoreHeader}>
								<span className={styles.rank}>#{i + 1}</span>
								<span className={styles.playerName}>{player.name}</span>
								<span className={styles.score}>{player.score} pts</span>
							</div>
							<dl className={styles.playerStats}>
								<div className={styles.stat}>
									<dt>Accuracy</dt>
									<dd>{acc === null ? "—" : `${acc}%`}</dd>
								</div>
								<div className={styles.stat}>
									<dt>Best streak</dt>
									<dd>{best}</dd>
								</div>
								{fav && (
									<div className={styles.stat}>
										<dt>Favorite genre</dt>
										<dd>{fav}</dd>
									</div>
								)}
								{worst && worst !== fav && (
									<div className={styles.stat}>
										<dt>Worst genre</dt>
										<dd>{worst}</dd>
									</div>
								)}
							</dl>
						</div>
					);
				})}
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
