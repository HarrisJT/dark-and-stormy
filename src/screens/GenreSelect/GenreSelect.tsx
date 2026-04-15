import { getNextPlayerIndex } from "logic/game";
import { getCurrentPlayer } from "state/transitions";
import type { GameState, GenreData } from "types";
import styles from "./GenreSelect.module.css";

type Props = {
	state: GameState;
	genres: GenreData[];
	onSelect: (genre: string) => void;
};

export default function GenreSelect({ state, genres, onSelect }: Props) {
	const currentPlayer = getCurrentPlayer(state);
	const card = state.currentCard;

	const isEnemyPicking = card?.type === "opponentChooses";

	const nextIndex = getNextPlayerIndex(
		state.currentPlayerIndex,
		state.players.length,
	);
	const nextPlayer = state.players[nextIndex]!;
	const picker = isEnemyPicking ? nextPlayer : currentPlayer;
	const label = card?.label ?? "";

	return (
		<div className={styles.genreSelect}>
			<div className={styles.cardLabel}>{label}</div>
			<div className={styles.instruction}>
				{picker.name}, pick a genre
				{isEnemyPicking && ` for ${currentPlayer.name}`}
			</div>
			<div className={styles.grid}>
				{genres.map((g) => (
					<button
						key={g.name}
						type="button"
						className={styles.genreBtn}
						onClick={() => onSelect(g.name)}
					>
						{g.name}
					</button>
				))}
			</div>
		</div>
	);
}
