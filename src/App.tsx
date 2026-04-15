import { useEffect, useReducer, useRef } from "react";
import styles from "./App.module.css";
import { gameReducer } from "state/reducer";
import type { Action } from "state/reducer";
import { clearSavedState, loadState, saveState } from "logic/storage";
import { loadGenres } from "logic/data";
import type { GameState } from "types";
import { SPECIAL_CARD_COUNT } from "types";
import Draw from "screens/Draw";
import GameOver from "screens/GameOver";
import GenreSelect from "screens/GenreSelect";
import Judge from "screens/Judge";
import LoseATurn from "screens/LoseATurn";
import Prompt from "screens/Prompt";
import Setup from "screens/Setup";

const allGenres = loadGenres();
const deckSize = allGenres.length + SPECIAL_CARD_COUNT;

// Read the seed once at module level. ?seed=42 → deterministic game for debugging.
const debugSeed =
	typeof location !== "undefined"
		? new URLSearchParams(location.search).get("seed") ?? undefined
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

	// Debounced persistence: write to localStorage 150ms after the last state change.
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			if (state) {
				saveState(state);
			} else {
				clearSavedState();
			}
		}, 150);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [state]);

	const isPlaying = state !== null && state.phase !== "gameOver";

	function send(action: Action) {
		dispatch(action);
	}

	// Strip ?seed=N from the URL so the address bar accurately reflects whether
	// the current game is seeded. PLAY_AGAIN always uses real randomness; if
	// someone wants to replay a seeded game they reload the page with ?seed=N.
	function handlePlayAgain() {
		history.replaceState({}, "", location.pathname);
		dispatch({ type: "PLAY_AGAIN" });
	}

	return (
		<div className={styles.app}>
			<header className={styles.header}>
				<span className={styles.title}>Dark &amp; Stormy</span>
				{isPlaying && (
					<button
						type="button"
						className={styles.newGameBtn}
						onClick={() => send({ type: "NEW_GAME" })}
					>
						New Game
					</button>
				)}
			</header>

			{!state && (
				<Setup
					onStart={(names, targetScore) =>
						send({
							type: "START_GAME",
							names,
							targetScore,
							seed: debugSeed !== undefined ? Number(debugSeed) : undefined,
						})
					}
				/>
			)}

			{state?.phase === "draw" && (
				<Draw
					state={state}
					onDraw={() => send({ type: "DRAW" })}
					deckSize={deckSize}
				/>
			)}

			{state?.phase === "loseATurn" && (
				<LoseATurn
					state={state}
					onContinue={() => send({ type: "CONTINUE_LOSE_A_TURN" })}
				/>
			)}

			{state?.phase === "genreSelect" && (
				<GenreSelect
					state={state}
					genres={allGenres}
					onSelect={(genre) => send({ type: "SELECT_GENRE", genre })}
				/>
			)}

			{state?.phase === "prompt" && (
				<Prompt
					state={state}
					onPassToJudge={() => send({ type: "PASS_TO_JUDGE" })}
				/>
			)}

			{state?.phase === "judge" && (
				<Judge
					state={state}
					onJudge={(correct) => send({ type: "JUDGE", correct })}
				/>
			)}

			{state?.phase === "gameOver" && (
				<GameOver
					state={state}
					onPlayAgain={handlePlayAgain}
					onNewGame={() => send({ type: "NEW_GAME" })}
				/>
			)}
		</div>
	);
}
