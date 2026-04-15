import type { GameState, PersistedState } from "types";
import { STORAGE_VERSION } from "types";

const STORAGE_KEY = "darkandstormy_gamestate";

export function saveState(state: GameState): void {
	try {
		const blob: PersistedState = { version: STORAGE_VERSION, state };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
	} catch {
		// Throws in private browsing (Safari/Firefox), quota exceeded, or disabled storage.
	}
}

export function loadState(): GameState | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { version?: number; state?: unknown };
		if (parsed.version !== STORAGE_VERSION) return null;
		return parsed.state as GameState;
	} catch {
		return null;
	}
}

export function clearSavedState(): void {
	localStorage.removeItem(STORAGE_KEY);
}
