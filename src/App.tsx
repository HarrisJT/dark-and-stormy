import { installButtonTilt } from "logic/buttonTilt";
import { allGenres } from "logic/data";
import { clearSavedState, loadState, saveState } from "logic/storage";
import { useEffect, useReducer } from "react";
import Draw from "screens/Draw/Draw";
import GameOver from "screens/GameOver/GameOver";
import GenreSelect from "screens/GenreSelect/GenreSelect";
import Judge from "screens/Judge/Judge";
import LoseATurn from "screens/LoseATurn/LoseATurn";
import Prompt from "screens/Prompt/Prompt";
import Setup from "screens/Setup/Setup";
import { gameReducer } from "state/reducer";
import type { GameState } from "types";
import { SPECIAL_CARD_COUNT } from "types";
import styles from "./App.module.css";

const deckSize = allGenres.length + SPECIAL_CARD_COUNT;

// Read the seed once at module level. ?seed=42 → deterministic game for debugging.
const debugSeed =
	typeof location !== "undefined"
		? (new URLSearchParams(location.search).get("seed") ?? undefined)
		: undefined;

function loadInitialState(): GameState | null {
	const saved = loadState();
	// Only resume mid-game phases. Show setup fresh if the game was over
	// or if the stored state is in a terminal/initial phase.
	if (!saved || saved.phase === "gameOver") return null;
	return saved;
}

export default function App() {
	const [state, dispatch] = useReducer(gameReducer, null, loadInitialState);

	useEffect(() => installButtonTilt(), []);

	useEffect(() => {
		const timerId = window.setTimeout(() => {
			if (state) {
				saveState(state);
			} else {
				clearSavedState();
			}
		}, 150);

		return () => {
			window.clearTimeout(timerId);
		};
	}, [state]);

	const isPlaying = state !== null && state.phase !== "gameOver";

	// Strip ?seed=N from the URL so the address bar accurately reflects whether
	// the current game is seeded. PLAY_AGAIN always uses real randomness; if
	// someone wants to replay a seeded game they reload the page with ?seed=N.
	function handlePlayAgain() {
		history.replaceState({}, "", location.pathname);
		dispatch({ type: "PLAY_AGAIN" });
	}

	function renderPhase() {
		if (!state) {
			return (
				<Setup
					onStart={(names, targetScore) =>
						dispatch({
							type: "START_GAME",
							names,
							targetScore,
							seed: debugSeed !== undefined ? Number(debugSeed) : undefined,
						})
					}
				/>
			);
		}

		switch (state.phase) {
			case "setup":
				return null;
			case "draw":
				return (
					<Draw
						state={state}
						onDraw={() => dispatch({ type: "DRAW" })}
						deckSize={deckSize}
					/>
				);
			case "loseATurn":
				return (
					<LoseATurn
						state={state}
						onContinue={() => dispatch({ type: "CONTINUE_LOSE_A_TURN" })}
					/>
				);
			case "genreSelect":
				return (
					<GenreSelect
						state={state}
						genres={allGenres}
						onSelect={(genre) => dispatch({ type: "SELECT_GENRE", genre })}
					/>
				);
			case "prompt":
				return (
					<Prompt
						state={state}
						onPassToJudge={() => dispatch({ type: "PASS_TO_JUDGE" })}
					/>
				);
			case "judge":
				return (
					<Judge
						state={state}
						onJudge={(correct) => dispatch({ type: "JUDGE", correct })}
					/>
				);
			case "gameOver":
				return (
					<GameOver
						state={state}
						onPlayAgain={handlePlayAgain}
						onNewGame={() => dispatch({ type: "NEW_GAME" })}
					/>
				);
			default: {
				const _exhaustive: never = state.phase;
				throw new Error(`Unhandled phase: ${_exhaustive}`);
			}
		}
	}

	return (
		<div className={styles.app}>
			<header className={styles.header}>
				<span className={styles.title}>Dark &amp; Stormy</span>
				{isPlaying && (
					<button
						type="button"
						className={styles.newGameBtn}
						onClick={() => dispatch({ type: "NEW_GAME" })}
					>
						New Game
					</button>
				)}
			</header>

			{renderPhase()}
		</div>
	);
}
