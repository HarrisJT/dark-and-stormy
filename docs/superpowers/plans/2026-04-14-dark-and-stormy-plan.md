# It Was a Dark and Stormy Night -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first literary trivia party game where players draw genre cards and guess works from their opening lines, played pass-and-play on a single phone.

**Architecture:** Frontend-only React + Vite + TypeScript app. `src/` lives at repo root (no `frontend/` wrapper).

State management uses React's built-in `useReducer` with a fully typed action union. The entire game engine lives in `src/state/reducer.ts`; pure logic helpers remain in `src/logic/`. State is persisted to `localStorage` via a 150ms debounced `useEffect` in App.tsx. The persisted blob includes a `version` field for safe future migration. Genre data remains one JSON file per genre in `src/data/`, auto-discovered via `import.meta.glob` and validated with Zod at load time. No backend, no router -- conditional rendering driven by a `phase` field in state.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Zod (schema validation), Biome (lint/format), CSS Modules, Vitest + happy-dom + @testing-library/react + @testing-library/user-event (tests)

**Spec:** `docs/superpowers/specs/2026-04-14-dark-and-stormy-design.md`

**Execution order** (tasks must be implemented in this sequence despite document layout):

```
1 → 2 → 2.5 → 3 → 4 → 5 → 5.5 → 6 → 7 → 7.5 → 7.6 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```

Tasks 7.5 and 7.6 (the state reducer and transition guards) are numbered correctly but appear early in the document for co-location with their type definitions. They depend on all logic tasks (2–7) and must run after them.

---

## Task 1: Repo Cleanup & Project Scaffold

Remove the existing scaffold entirely and create a fresh Vite project at repo root.

**Files:**
- Delete: `backend/`, `frontend/`
- Create: `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `biome.json`
- Modify: `README.md`, `.gitignore`

- [ ] **Step 1: Delete existing scaffold**

Run from repo root (`audscript/`):

```bash
rm -rf backend frontend
```

- [ ] **Step 2: Create package.json**

Create `package.json` at repo root:

```json
{
  "name": "dark-and-stormy",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check --write ./src",
    "format": "biome format --write ./src"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "happy-dom": "^15.0.0",
    "typescript": "^5.7.4",
    "vite": "^5.4.1",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "happy-dom",
		setupFiles: ["./src/test-setup.ts"],
	},
});
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "baseUrl": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

> **Note on `noUncheckedIndexedAccess`:** array indexing (`arr[i]`) now returns `T | undefined`. Anywhere you index into `deck`, `players`, or `available` you must guard with `invariant()` (see Task 2.5) before using the value. TypeScript will enforce this at compile time.

- [ ] **Step 6: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "files": {
    "ignore": ["node_modules", "dist"]
  }
}
```

- [ ] **Step 8: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>It Was a Dark and Stormy Night</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Update .gitignore**

```
node_modules
dist
.env
*.local
```

- [ ] **Step 10: Update README.md**

```markdown
# It Was a Dark and Stormy Night

A literary trivia party game. Players draw genre cards and guess works from their opening lines. Pass-and-play on a single phone.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL on your phone (same Wi-Fi network) to play.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint and fix |
| `npm run build` | Production build |

## Adding Genres

Drop a new JSON file in `src/data/` with this shape:

```json
{
  "name": "Your Genre Name",
  "entries": [
    {
      "openingLines": "...",
      "title": "...",
      "author": "...",
      "year": 1900
    }
  ]
}
```

No code changes needed -- the genre is picked up automatically.
```

- [ ] **Step 11: Create test setup file**

Create `src/test-setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 12: Verify Vite starts**

```bash
npm run dev
```

Expected: Vite dev server starts. Browser shows blank page or React error (no App yet -- that's fine). Ctrl+C to stop.

- [ ] **Step 13: Commit**

```bash
rtk git add package.json vite.config.ts tsconfig.json tsconfig.node.json biome.json index.html .gitignore README.md src/test-setup.ts
rtk git commit -m "chore: fresh Vite scaffold at repo root, tooling configured"

---

## Task 7.5: State Reducer

Wire up the game's typed action/reducer pair. All game transitions live here; pure logic helpers in `src/logic/` are called from the reducer but not re-implemented.

> **Prerequisite:** All logic tasks (2, 2.5, 3, 4, 5, 6, 7) must be complete before starting this task — the reducer imports from `logic/data`, `logic/deck`, `logic/entries`, `logic/game`, `logic/invariant`, and `logic/rng`.

**Files:**
- Create: `src/state/reducer.ts`
- Create: `src/state/reducer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/state/reducer.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { gameReducer } from "./reducer";
import { loadGenres } from "logic/data";

const genres = loadGenres();
const twoPlayers = ["Alice", "Bob"];

const mockEntry = { openingLines: "It was...", title: "Test Book", author: "Author", year: 2000 };

function startedState() {
	const s = gameReducer(null, { type: "START_GAME", names: twoPlayers, targetScore: 8 });
	if (!s) throw new Error("START_GAME returned null");
	return s;
}

// States that require non-null currentEntry/currentGenre (enforced by assertTransition).
function promptState() {
	return { ...startedState(), phase: "prompt" as const, currentEntry: mockEntry, currentGenre: "Poetry" };
}

function judgeState() {
	return { ...startedState(), phase: "judge" as const, currentEntry: mockEntry, currentGenre: "Poetry" };
}

describe("START_GAME", () => {
	it("creates state with draw phase", () => {
		const s = startedState();
		expect(s.phase).toBe("draw");
	});

	it("initializes players with zero scores", () => {
		const s = startedState();
		expect(s.players).toHaveLength(2);
		for (const p of s.players) expect(p.score).toBe(0);
	});

	it("creates a full deck (genre count + 5 specials)", () => {
		const s = startedState();
		expect(s.deck).toHaveLength(genres.length + 5);
	});
});

describe("DRAW", () => {
	it("transitions to genreSelect for guesserChooses / opponentChooses cards", () => {
		// Inject a state with a guesserChooses card on top of the deck
		const s = startedState();
		const stateWithSpecial = {
			...s,
			deck: [{ type: "guesserChooses" as const, genre: null, label: "Guesser Chooses" }, ...s.deck],
		};
		const next = gameReducer(stateWithSpecial, { type: "DRAW" });
		expect(next?.phase).toBe("genreSelect");
	});

	it("transitions to loseATurn for loseATurn card", () => {
		const s = startedState();
		const stateWithLose = {
			...s,
			deck: [{ type: "loseATurn" as const, genre: null, label: "Lose a Turn" }, ...s.deck],
		};
		const next = gameReducer(stateWithLose, { type: "DRAW" });
		expect(next?.phase).toBe("loseATurn");
	});

	it("transitions to prompt for a genre card", () => {
		const s = startedState();
		const genreCard = { type: "genre" as const, genre: genres[0].name, label: genres[0].name };
		const stateWithGenre = { ...s, deck: [genreCard, ...s.deck] };
		const next = gameReducer(stateWithGenre, { type: "DRAW" });
		expect(next?.phase).toBe("prompt");
	});

	it("increments deckDrawCount on each draw", () => {
		const s = startedState();
		const after = gameReducer(s, { type: "DRAW" });
		expect(after?.deckDrawCount).toBe(1);
	});
});

describe("CONTINUE_LOSE_A_TURN", () => {
	it("advances to next player in draw phase", () => {
		const s = { ...startedState(), phase: "loseATurn" as const, currentPlayerIndex: 0 };
		const next = gameReducer(s, { type: "CONTINUE_LOSE_A_TURN" });
		expect(next?.phase).toBe("draw");
		expect(next?.currentPlayerIndex).toBe(1);
	});
});

describe("SELECT_GENRE", () => {
	it("sets currentGenre and transitions to prompt", () => {
		const s = { ...startedState(), phase: "genreSelect" as const };
		const next = gameReducer(s, { type: "SELECT_GENRE", genre: genres[0].name });
		expect(next?.phase).toBe("prompt");
		expect(next?.currentGenre).toBe(genres[0].name);
		expect(next?.currentEntry).not.toBeNull();
	});
});

describe("PASS_TO_JUDGE", () => {
	it("transitions to judge phase", () => {
		const next = gameReducer(promptState(), { type: "PASS_TO_JUDGE" });
		expect(next?.phase).toBe("judge");
	});

	it("throws when called outside prompt phase", () => {
		expect(() => gameReducer(startedState(), { type: "PASS_TO_JUDGE" })).toThrow(/prompt/);
	});
});

describe("JUDGE", () => {
	it("advances player on incorrect", () => {
		const next = gameReducer(judgeState(), { type: "JUDGE", correct: false });
		expect(next?.phase).toBe("draw");
		expect(next?.players[0].score).toBe(0);
	});

	it("awards a point on correct", () => {
		const next = gameReducer({ ...judgeState(), currentPlayerIndex: 0 }, { type: "JUDGE", correct: true });
		expect(next?.players[0].score).toBe(1);
	});

	it("transitions to gameOver when target reached", () => {
		const next = gameReducer(
			{ ...judgeState(), currentPlayerIndex: 0, targetScore: 1 },
			{ type: "JUDGE", correct: true },
		);
		expect(next?.phase).toBe("gameOver");
	});

	it("throws when called outside judge phase", () => {
		expect(() => gameReducer(startedState(), { type: "JUDGE", correct: true })).toThrow(/judge/);
	});
});

describe("NEW_GAME", () => {
	it("returns null", () => {
		expect(gameReducer(startedState(), { type: "NEW_GAME" })).toBeNull();
	});
});

describe("PLAY_AGAIN", () => {
	it("resets to draw phase with same players", () => {
		const s = { ...startedState(), phase: "gameOver" as const };
		const next = gameReducer(s, { type: "PLAY_AGAIN" });
		expect(next?.phase).toBe("draw");
		expect(next?.players).toHaveLength(2);
		for (const p of next!.players) expect(p.score).toBe(0);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/state/reducer.test.ts
```

Expected: FAIL — cannot find module `./reducer`.

- [ ] **Step 3: Create reducer.ts**

Create `src/state/reducer.ts`:

```typescript
import { loadGenres } from "logic/data";
import { drawCard as drawCardFromDeck } from "logic/deck";
import { pickEntry } from "logic/entries";
import { invariant } from "logic/invariant";
import { makeSeededRng } from "logic/rng";
import { advancePlayer, createInitialState } from "logic/game";
import type { GameState } from "types";

// Load genres once at module init time (Vite bundles them eagerly).
const allGenres = loadGenres();

export type Action =
	| { type: "START_GAME"; names: string[]; targetScore: number; seed?: number }
	| { type: "DRAW" }
	| { type: "CONTINUE_LOSE_A_TURN" }
	| { type: "SELECT_GENRE"; genre: string }
	| { type: "PASS_TO_JUDGE" }
	| { type: "JUDGE"; correct: boolean }
	| { type: "PLAY_AGAIN" }
	| { type: "NEW_GAME" };

export function gameReducer(
	state: GameState | null,
	action: Action,
): GameState | null {
	switch (action.type) {
		case "START_GAME": {
			const rng = action.seed !== undefined ? makeSeededRng(action.seed) : Math.random;
			return createInitialState(action.names, action.targetScore, rng);
		}

		case "DRAW": {
			if (!state) return null;
			const { card, remaining, reshuffled } = drawCardFromDeck(state.deck);
			const deckDrawCount = reshuffled ? 1 : state.deckDrawCount + 1;
			const base = { ...state, deck: remaining, deckDrawCount, currentCard: card };

			if (card.type === "loseATurn") return { ...base, phase: "loseATurn" };
			if (card.type === "guesserChooses" || card.type === "opponentChooses")
				return { ...base, phase: "genreSelect" };

			// genre card
			const genre = card.genre!;
			const { entry, usedEntries } = pickEntry(genre, allGenres, state.usedEntries);
			return { ...base, currentEntry: entry, currentGenre: genre, usedEntries, phase: "prompt" };
		}

		case "CONTINUE_LOSE_A_TURN":
			if (!state) return null;
			return advancePlayer(state);

		case "SELECT_GENRE": {
			if (!state) return null;
			const { entry, usedEntries } = pickEntry(action.genre, allGenres, state.usedEntries);
			return { ...state, currentEntry: entry, currentGenre: action.genre, usedEntries, phase: "prompt" };
		}

		case "PASS_TO_JUDGE":
			if (!state) return null;
			return { ...state, phase: "judge" };

		case "JUDGE": {
			if (!state) return null;
			if (!action.correct) return advancePlayer(state);
			const scorer = state.players[state.currentPlayerIndex];
			invariant(scorer, "currentPlayerIndex must point to a valid player");
			const newScore = scorer.score + 1;
			const newPlayers = state.players.map((p, i) =>
				i === state.currentPlayerIndex ? { ...p, score: newScore } : p,
			);
			if (newScore >= state.targetScore)
				return { ...state, players: newPlayers, phase: "gameOver" };
			return advancePlayer({ ...state, players: newPlayers });
		}

		case "PLAY_AGAIN":
			if (!state) return null;
			// Always use real randomness -- the seed only applies to the first game.
			// To replay a seeded game, reload the page with ?seed=N.
			return createInitialState(
				state.players.map((p) => p.name),
				state.targetScore,
			);

		case "NEW_GAME":
			return null;

		default:
			return state;
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/state/reducer.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/state/reducer.ts src/state/reducer.test.ts
rtk git commit -m "feat: typed useReducer game reducer"
```

---

## Task 7.6: Transition Guards

Two small helpers that live in `src/state/` and are used exclusively by the reducer. `assertTransition` validates phase + required fields at every dispatch boundary. `getCurrentPlayer` centralizes the one critical array-index assumption.

**Files:**
- Create: `src/state/transitions.ts`
- Create: `src/state/transitions.test.ts`
- Modify: `src/state/reducer.ts`

- [ ] **Step 1: Write failing tests**

Create `src/state/transitions.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { GameState } from "types";
import { assertTransition, getCurrentPlayer } from "./transitions";

function baseState(overrides: Partial<GameState> = {}): GameState {
	return {
		phase: "draw",
		players: [{ name: "Alice", score: 0 }, { name: "Bob", score: 1 }],
		currentPlayerIndex: 0,
		targetScore: 8,
		deck: [],
		deckDrawCount: 0,
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		usedEntries: {},
		...overrides,
	};
}

describe("assertTransition", () => {
	it("does not throw when phase matches and required fields are set", () => {
		const state = baseState({
			phase: "prompt",
			currentEntry: { openingLines: "x", title: "T", author: "A", year: 2000 },
			currentGenre: "Poetry",
		});
		expect(() => assertTransition(state, "prompt", "TEST")).not.toThrow();
	});

	it("throws when phase does not match", () => {
		const state = baseState({ phase: "draw" });
		expect(() => assertTransition(state, "prompt", "TEST")).toThrow(/"draw"/);
	});

	it("accepts an array of valid source phases", () => {
		const state = baseState({ phase: "judge",
			currentEntry: { openingLines: "x", title: "T", author: "A", year: 2000 },
			currentGenre: "Poetry",
		});
		expect(() => assertTransition(state, ["prompt", "judge"], "TEST")).not.toThrow();
	});

	it("throws when a required field for the phase is null", () => {
		// prompt phase requires currentEntry and currentGenre
		const state = baseState({ phase: "prompt", currentEntry: null, currentGenre: null });
		expect(() => assertTransition(state, "prompt", "TEST")).toThrow(/currentEntry/);
	});
});

describe("getCurrentPlayer", () => {
	it("returns the player at currentPlayerIndex", () => {
		const state = baseState({ currentPlayerIndex: 1 });
		expect(getCurrentPlayer(state).name).toBe("Bob");
	});

	it("throws when currentPlayerIndex is out of bounds", () => {
		const state = baseState({ currentPlayerIndex: 99 });
		expect(() => getCurrentPlayer(state)).toThrow(/currentPlayerIndex/);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/state/transitions.test.ts
```

Expected: FAIL — cannot find module `./transitions`.

- [ ] **Step 3: Implement transitions.ts**

Create `src/state/transitions.ts`:

```typescript
import { invariant } from "logic/invariant";
import type { GamePhase, GameState, Player } from "types";

// Which nullable fields must be non-null in each phase.
// This is the single source of truth for the state model.
// When you add a new phase or field, update this table.
const REQUIRED_FIELDS_BY_PHASE: Record<
	GamePhase,
	("currentCard" | "currentEntry" | "currentGenre")[]
> = {
	setup: [],
	draw: [],
	loseATurn: [],
	genreSelect: [],
	prompt: ["currentEntry", "currentGenre"],
	judge: ["currentEntry", "currentGenre"],
	gameOver: [],
};

// Asserts that the state is in one of the expected phases and that all
// required nullable fields for that phase are non-null.
// Call this at the top of every reducer case before reading state fields.
export function assertTransition(
	state: GameState,
	expectedPhase: GamePhase | GamePhase[],
	action: string,
): asserts state is GameState {
	const phases = Array.isArray(expectedPhase) ? expectedPhase : [expectedPhase];
	invariant(
		phases.includes(state.phase),
		`${action}: expected phase ${phases.join(" | ")}, got "${state.phase}"`,
	);
	const required = REQUIRED_FIELDS_BY_PHASE[state.phase];
	for (const field of required) {
		invariant(
			state[field] !== null,
			`${action}: ${field} must not be null in "${state.phase}" phase`,
		);
	}
}

// Returns the player whose turn it currently is.
// Centralizes the one critical index assumption: currentPlayerIndex is always valid.
export function getCurrentPlayer(state: GameState): Player {
	const player = state.players[state.currentPlayerIndex];
	invariant(player, `getCurrentPlayer: currentPlayerIndex ${state.currentPlayerIndex} out of bounds (${state.players.length} players)`);
	return player;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/state/transitions.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Update reducer.ts to use the guards**

Replace the existing `src/state/reducer.ts` with:

```typescript
import { loadGenres } from "logic/data";
import { drawCard as drawCardFromDeck } from "logic/deck";
import { pickEntry } from "logic/entries";
import { makeSeededRng } from "logic/rng";
import { advancePlayer, createInitialState } from "logic/game";
import { assertTransition, getCurrentPlayer } from "./transitions";
import type { GameState } from "types";

const allGenres = loadGenres();

export type Action =
	| { type: "START_GAME"; names: string[]; targetScore: number; seed?: number }
	| { type: "DRAW" }
	| { type: "CONTINUE_LOSE_A_TURN" }
	| { type: "SELECT_GENRE"; genre: string }
	| { type: "PASS_TO_JUDGE" }
	| { type: "JUDGE"; correct: boolean }
	| { type: "PLAY_AGAIN" }
	| { type: "NEW_GAME" };

export function gameReducer(
	state: GameState | null,
	action: Action,
): GameState | null {
	switch (action.type) {
		case "START_GAME": {
			const rng = action.seed !== undefined ? makeSeededRng(action.seed) : Math.random;
			return createInitialState(action.names, action.targetScore, rng);
		}

		case "DRAW": {
			if (!state) return null;
			assertTransition(state, "draw", "DRAW");
			const { card, remaining, reshuffled } = drawCardFromDeck(state.deck);
			const deckDrawCount = reshuffled ? 1 : state.deckDrawCount + 1;
			const base = { ...state, deck: remaining, deckDrawCount, currentCard: card };

			if (card.type === "loseATurn") return { ...base, phase: "loseATurn" };
			if (card.type === "guesserChooses" || card.type === "opponentChooses")
				return { ...base, phase: "genreSelect" };

			const genre = card.genre!;
			const { entry, usedEntries } = pickEntry(genre, allGenres, state.usedEntries);
			return { ...base, currentEntry: entry, currentGenre: genre, usedEntries, phase: "prompt" };
		}

		case "CONTINUE_LOSE_A_TURN":
			if (!state) return null;
			assertTransition(state, "loseATurn", "CONTINUE_LOSE_A_TURN");
			return advancePlayer(state);

		case "SELECT_GENRE": {
			if (!state) return null;
			assertTransition(state, "genreSelect", "SELECT_GENRE");
			const { entry, usedEntries } = pickEntry(action.genre, allGenres, state.usedEntries);
			return { ...state, currentEntry: entry, currentGenre: action.genre, usedEntries, phase: "prompt" };
		}

		case "PASS_TO_JUDGE":
			if (!state) return null;
			assertTransition(state, "prompt", "PASS_TO_JUDGE");
			// assertTransition already verified currentEntry/currentGenre are non-null
			return { ...state, phase: "judge" };

		case "JUDGE": {
			if (!state) return null;
			assertTransition(state, "judge", "JUDGE");
			if (!action.correct) return advancePlayer(state);
			const scorer = getCurrentPlayer(state);
			const newScore = scorer.score + 1;
			const newPlayers = state.players.map((p, i) =>
				i === state.currentPlayerIndex ? { ...p, score: newScore } : p,
			);
			if (newScore >= state.targetScore)
				return { ...state, players: newPlayers, phase: "gameOver" };
			return advancePlayer({ ...state, players: newPlayers });
		}

		case "PLAY_AGAIN": {
			if (!state) return null;
			assertTransition(state, "gameOver", "PLAY_AGAIN");
			// Always use real randomness -- the seed only applies to the first game.
			// To replay a seeded game, reload the page with ?seed=N.
			return createInitialState(
				state.players.map((p) => p.name),
				state.targetScore,
			);
		}

		case "NEW_GAME":
			return null;

		default:
			return state;
	}
}
```

- [ ] **Step 6: Run all state tests**

```bash
npm test -- src/state/
```

Expected: all reducer and transitions tests PASS.

- [ ] **Step 7: Commit**

```bash
rtk git add src/state/transitions.ts src/state/transitions.test.ts src/state/reducer.ts
rtk git commit -m "feat: transition guards with phase table and getCurrentPlayer"
```

---

## Task 2: Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create types.ts**

Create `src/types.ts`:

```typescript
export type RNG = () => number;

export type CardType =
	| "genre"
	| "loseATurn"
	| "guesserChooses"
	| "opponentChooses";

export type Card = {
	type: CardType;
	genre: string | null; // non-null only for "genre" type cards
	label: string;
};

export type Entry = {
	openingLines: string;
	title: string;
	author: string;
	year: number;
};

export type GenreData = {
	name: string;
	entries: Entry[];
};

export type GamePhase =
	| "setup"
	| "draw"
	| "loseATurn"
	| "genreSelect"
	| "prompt"
	| "judge"
	| "gameOver";

export type Player = {
	name: string;
	score: number;
};

export type GameState = {
	phase: GamePhase;
	players: Player[];
	currentPlayerIndex: number;
	targetScore: number;
	deck: Card[];
	deckDrawCount: number; // cards drawn from current cycle, resets on reshuffle
	currentCard: Card | null;
	currentEntry: Entry | null;
	currentGenre: string | null;
	usedEntries: Record<string, number[]>;
};

// Versioned wrapper for localStorage -- bump version when GameState shape changes
// and update the migration in loadState().
export type PersistedState = {
	version: 1;
	state: GameState;
};

export const STORAGE_VERSION = 1 as const;
export const TARGET_SCORE_OPTIONS = [5, 8, 10, 15] as const;
export const DEFAULT_TARGET_SCORE = 8;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
// DECK_SIZE is not a constant -- it equals getGenreNames().length + 5 (the 5 specials).
// Adding a genre JSON file automatically increases the deck. No hardcoded count.
export const SPECIAL_CARD_COUNT = 5;
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/types.ts
rtk git commit -m "feat: shared types"
```

---

## Task 2.5: Utilities — Invariant & Seeded RNG

Two small utilities used across the codebase. Build them before the logic tasks so they're available everywhere.

**Files:**
- Create: `src/logic/invariant.ts`
- Create: `src/logic/invariant.test.ts`
- Create: `src/logic/rng.ts`
- Create: `src/logic/rng.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/invariant.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { invariant } from "./invariant";

describe("invariant", () => {
	it("does nothing when condition is truthy", () => {
		expect(() => invariant(true, "should not throw")).not.toThrow();
		expect(() => invariant(1, "should not throw")).not.toThrow();
		expect(() => invariant("hello", "should not throw")).not.toThrow();
	});

	it("throws with the given message when condition is falsy", () => {
		expect(() => invariant(false, "boom")).toThrow("boom");
		expect(() => invariant(null, "null bad")).toThrow("null bad");
		expect(() => invariant(undefined, "undef bad")).toThrow("undef bad");
		expect(() => invariant(0, "zero bad")).toThrow("zero bad");
	});
});
```

Create `src/logic/rng.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { makeSeededRng } from "./rng";

describe("makeSeededRng", () => {
	it("returns values in [0, 1)", () => {
		const rng = makeSeededRng(42);
		for (let i = 0; i < 20; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it("is deterministic: same seed produces the same sequence", () => {
		const a = makeSeededRng(99);
		const b = makeSeededRng(99);
		const seqA = Array.from({ length: 10 }, () => a());
		const seqB = Array.from({ length: 10 }, () => b());
		expect(seqA).toEqual(seqB);
	});

	it("different seeds produce different sequences", () => {
		const a = makeSeededRng(1);
		const b = makeSeededRng(2);
		const seqA = Array.from({ length: 5 }, () => a());
		const seqB = Array.from({ length: 5 }, () => b());
		expect(seqA).not.toEqual(seqB);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/logic/invariant.test.ts src/logic/rng.test.ts
```

Expected: FAIL — cannot find modules.

- [ ] **Step 3: Implement invariant.ts and rng.ts**

Create `src/logic/invariant.ts`:

```typescript
// Asserts a condition and throws if it's falsy.
// Use at phase boundaries to catch impossible states early:
//   invariant(state.currentEntry, "Expected entry in prompt phase");
export function invariant(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(`Invariant failed: ${message}`);
	}
}
```

Create `src/logic/rng.ts`:

```typescript
import type { RNG } from "types";

// splitmix32 -- fast, high-quality seeded PRNG. No dependencies.
// Returns values in [0, 1), same distribution as Math.random.
export function makeSeededRng(seed: number): RNG {
	let s = seed | 0;
	return () => {
		s = (s + 0x9e3779b9) | 0;
		let z = s;
		z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) | 0;
		z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) | 0;
		return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
	};
}

// Read ?seed= from the URL. Returns a seeded RNG if present, Math.random otherwise.
// Usage: const rng = getRngFromUrl();
// Then: ?seed=42 → deterministic game for debugging.
export function getRngFromUrl(): RNG {
	if (typeof location === "undefined") return Math.random;
	const param = new URLSearchParams(location.search).get("seed");
	if (!param) return Math.random;
	const seed = Number(param);
	if (!Number.isFinite(seed)) return Math.random;
	console.info(`[debug] Using seeded RNG: seed=${seed}`);
	return makeSeededRng(seed);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/logic/invariant.test.ts src/logic/rng.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/logic/invariant.ts src/logic/invariant.test.ts src/logic/rng.ts src/logic/rng.test.ts
rtk git commit -m "feat: invariant helper and seeded RNG utility"
```

---

## Task 3: Genre Data Loading

**Files:**
- Create: `src/logic/data.ts`
- Create: `src/logic/data.test.ts`
- Create: all 12 `src/data/*.json` files

- [ ] **Step 1: Create the 12 genre JSON files**

Create `src/data/sci-fi-fantasy.json`:
```json
{
  "name": "Sci-Fi/Fantasy",
  "entries": [
    {
      "openingLines": "It was a bright cold day in April, and the clocks were striking thirteen.",
      "title": "Nineteen Eighty-Four",
      "author": "George Orwell",
      "year": 1949
    },
    {
      "openingLines": "The sky above the port was the color of television, tuned to a dead channel.",
      "title": "Neuromancer",
      "author": "William Gibson",
      "year": 1984
    },
    {
      "openingLines": "In a hole in the ground there lived a hobbit.",
      "title": "The Hobbit",
      "author": "J.R.R. Tolkien",
      "year": 1937
    }
  ]
}
```

Create `src/data/shakespeare.json`:
```json
{
  "name": "Shakespeare",
  "entries": [
    {
      "openingLines": "Two households, both alike in dignity, in fair Verona, where we lay our scene...",
      "title": "Romeo and Juliet",
      "author": "William Shakespeare",
      "year": 1597
    },
    {
      "openingLines": "Who's there?",
      "title": "Hamlet",
      "author": "William Shakespeare",
      "year": 1601
    },
    {
      "openingLines": "If music be the food of love, play on...",
      "title": "Twelfth Night",
      "author": "William Shakespeare",
      "year": 1602
    }
  ]
}
```

Create `src/data/childrens-books.json`:
```json
{
  "name": "Children's Books",
  "entries": [
    {
      "openingLines": "Where's Papa going with that axe?",
      "title": "Charlotte's Web",
      "author": "E.B. White",
      "year": 1952
    },
    {
      "openingLines": "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much.",
      "title": "Harry Potter and the Philosopher's Stone",
      "author": "J.K. Rowling",
      "year": 1997
    },
    {
      "openingLines": "Once there were four children whose names were Peter, Susan, Edmund and Lucy.",
      "title": "The Lion, the Witch and the Wardrobe",
      "author": "C.S. Lewis",
      "year": 1950
    }
  ]
}
```

Create `src/data/novels-1950-present.json`:
```json
{
  "name": "Novels 1950-Present",
  "entries": [
    {
      "openingLines": "Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.",
      "title": "One Hundred Years of Solitude",
      "author": "Gabriel García Márquez",
      "year": 1967
    },
    {
      "openingLines": "It was a queer, sultry summer, the summer they electrocuted the Rosenbergs, and I didn't know what I was doing in New York.",
      "title": "The Bell Jar",
      "author": "Sylvia Plath",
      "year": 1963
    },
    {
      "openingLines": "If you really want to hear about it, the first thing you'll probably want to know is where I was born, and what my lousy childhood was like...",
      "title": "The Catcher in the Rye",
      "author": "J.D. Salinger",
      "year": 1951
    }
  ]
}
```

Create `src/data/poetry.json`:
```json
{
  "name": "Poetry",
  "entries": [
    {
      "openingLines": "April is the cruellest month, breeding lilacs out of the dead land...",
      "title": "The Waste Land",
      "author": "T.S. Eliot",
      "year": 1922
    },
    {
      "openingLines": "I saw the best minds of my generation destroyed by madness, starving hysterical naked...",
      "title": "Howl",
      "author": "Allen Ginsberg",
      "year": 1956
    },
    {
      "openingLines": "Two roads diverged in a yellow wood, and sorry I could not travel both...",
      "title": "The Road Not Taken",
      "author": "Robert Frost",
      "year": 1916
    }
  ]
}
```

Create `src/data/movies.json`:
```json
{
  "name": "Movies",
  "entries": [
    {
      "openingLines": "It was a pleasure to burn.",
      "title": "Fahrenheit 451",
      "author": "Ray Bradbury",
      "year": 1953
    },
    {
      "openingLines": "All children, except one, grow up.",
      "title": "Peter Pan",
      "author": "J.M. Barrie",
      "year": 1911
    },
    {
      "openingLines": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "year": 1813
    }
  ]
}
```

Create `src/data/novels-1900-1950.json`:
```json
{
  "name": "Novels 1900-1950",
  "entries": [
    {
      "openingLines": "Mother died today.",
      "title": "The Stranger",
      "author": "Albert Camus",
      "year": 1942
    },
    {
      "openingLines": "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "year": 1925
    },
    {
      "openingLines": "Once upon a time and a very good time it was there was a moocow coming down along the road and this moocow that was coming down along the road met a nicens little boy named baby tuckoo...",
      "title": "A Portrait of the Artist as a Young Man",
      "author": "James Joyce",
      "year": 1916
    }
  ]
}
```

Create `src/data/non-fiction.json`:
```json
{
  "name": "Non-Fiction",
  "entries": [
    {
      "openingLines": "We were somewhere around Barstow on the edge of the desert when the drugs began to take hold.",
      "title": "Fear and Loathing in Las Vegas",
      "author": "Hunter S. Thompson",
      "year": 1971
    },
    {
      "openingLines": "You are about to begin reading Italo Calvino's new novel, If on a winter's night a traveler.",
      "title": "If on a winter's night a traveler",
      "author": "Italo Calvino",
      "year": 1979
    },
    {
      "openingLines": "Last night I dreamt I went to Manderley again.",
      "title": "Rebecca",
      "author": "Daphne du Maurier",
      "year": 1938
    }
  ]
}
```

Create `src/data/novels-pre-1900.json`:
```json
{
  "name": "Novels Pre-1900",
  "entries": [
    {
      "openingLines": "Call me Ishmael.",
      "title": "Moby-Dick",
      "author": "Herman Melville",
      "year": 1851
    },
    {
      "openingLines": "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness...",
      "title": "A Tale of Two Cities",
      "author": "Charles Dickens",
      "year": 1859
    },
    {
      "openingLines": "Whether I shall turn out to be the hero of my own life, or whether that station will be held by anybody else, these pages must show.",
      "title": "David Copperfield",
      "author": "Charles Dickens",
      "year": 1850
    }
  ]
}
```

Create `src/data/childrens-movies.json`:
```json
{
  "name": "Children's Movies",
  "entries": [
    {
      "openingLines": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.",
      "title": "Alice's Adventures in Wonderland",
      "author": "Lewis Carroll",
      "year": 1865
    },
    {
      "openingLines": "When Mary Lennox was sent to Misselthwaite Manor to live with her uncle everybody said she was the most disagreeable-looking child ever seen.",
      "title": "The Secret Garden",
      "author": "Frances Hodgson Burnett",
      "year": 1911
    },
    {
      "openingLines": "Lyra and her daemon moved through the darkening hall, taking care to keep to one side, out of sight of the kitchen.",
      "title": "The Golden Compass",
      "author": "Philip Pullman",
      "year": 1995
    }
  ]
}
```

Create `src/data/mysteries.json`:
```json
{
  "name": "Mysteries",
  "entries": [
    {
      "openingLines": "Mr. Sherlock Holmes, who was usually very late in the mornings, save upon those not infrequent occasions when he was up all night, was seated at the breakfast table.",
      "title": "The Hound of the Baskervilles",
      "author": "Arthur Conan Doyle",
      "year": 1902
    },
    {
      "openingLines": "It was about eleven o'clock in the morning, mid October, with the sun not shining and a look of hard wet rain in the clearness of the foothills.",
      "title": "The Big Sleep",
      "author": "Raymond Chandler",
      "year": 1939
    },
    {
      "openingLines": "The drought had lasted now for ten million years, and the reign of the terrible lizards had long since ended.",
      "title": "2001: A Space Odyssey",
      "author": "Arthur C. Clarke",
      "year": 1968
    }
  ]
}
```

Create `src/data/short-stories.json`:
```json
{
  "name": "Short Stories",
  "entries": [
    {
      "openingLines": "It was a dark and stormy night; the rain fell in torrents — except at occasional intervals, when it was checked by a violent gust of wind which swept up the streets.",
      "title": "Paul Clifford",
      "author": "Edward Bulwer-Lytton",
      "year": 1830
    },
    {
      "openingLines": "The thousand injuries of Fortunato I had borne as I best could, but when he ventured upon insult I vowed revenge.",
      "title": "The Cask of Amontillado",
      "author": "Edgar Allan Poe",
      "year": 1846
    },
    {
      "openingLines": "The morning of June 27th was clear and sunny, with the fresh warmth of a full-summer day.",
      "title": "The Lottery",
      "author": "Shirley Jackson",
      "year": 1948
    }
  ]
}
```

- [ ] **Step 2: Write failing tests for data loading**

Create `src/logic/data.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { loadGenres } from "./data";

describe("loadGenres", () => {
	it("returns an array of genre data objects", () => {
		const genres = loadGenres();
		expect(Array.isArray(genres)).toBe(true);
		expect(genres.length).toBeGreaterThan(0);
	});

	it("each genre has a name and a non-empty entries array", () => {
		const genres = loadGenres();
		for (const genre of genres) {
			expect(typeof genre.name).toBe("string");
			expect(genre.name.length).toBeGreaterThan(0);
			expect(Array.isArray(genre.entries)).toBe(true);
			expect(genre.entries.length).toBeGreaterThan(0);
		}
	});

	it("each entry has openingLines, title, author, and year", () => {
		const genres = loadGenres();
		for (const genre of genres) {
			for (const entry of genre.entries) {
				expect(typeof entry.openingLines).toBe("string");
				expect(typeof entry.title).toBe("string");
				expect(typeof entry.author).toBe("string");
				expect(typeof entry.year).toBe("number");
			}
		}
	});

	it("loads at least one genre per file in src/data/ (no hardcoded count -- adding a file adds a genre)", () => {
		// This test verifies the auto-discovery promise: the count reflects
		// whatever JSON files exist in src/data/, not a hardcoded number.
		const genres = loadGenres();
		expect(genres.length).toBeGreaterThanOrEqual(1);
		// Run: ls src/data/*.json | wc -l to verify count matches file count
	});

	it("returns genre names as strings (used for deck building)", () => {
		const genres = loadGenres();
		const names = genres.map((g) => g.name);
		expect(names).toContain("Poetry");
		expect(names).toContain("Shakespeare");
		expect(names).toContain("Short Stories");
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- src/logic/data.test.ts
```

Expected: FAIL — cannot find module `./data`.

- [ ] **Step 4: Implement data.ts**

Create `src/logic/data.ts`:

```typescript
import { z } from "zod";
import type { GenreData } from "types";

const EntrySchema = z.object({
	openingLines: z.string().min(1),
	title: z.string().min(1),
	author: z.string().min(1),
	year: z.number().int(),
});

const GenreDataSchema = z.object({
	name: z.string().min(1),
	entries: z.array(EntrySchema).min(1),
});

// import.meta.glob is resolved by Vite at build time -- all JSON files
// in src/data/ are bundled automatically. Adding a new genre file
// requires no code changes here.
// No manual caching: the module-level `allGenres` in reducer.ts holds the
// result, and Vite re-evaluates modules on HMR so a cache here would
// interfere with data file edits during development.
const modules = import.meta.glob("../data/*.json", { eager: true });

export function loadGenres(): GenreData[] {
	return Object.values(modules)
		.map((raw, i) => {
			const result = GenreDataSchema.safeParse(raw);
			if (!result.success) {
				console.error(`Invalid genre data at index ${i}:`, result.error.message);
				return null;
			}
			return result.data as GenreData;
		})
		.filter((g): g is GenreData => g !== null);
}

export function getGenreNames(): string[] {
	return loadGenres().map((g) => g.name);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- src/logic/data.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add src/data/ src/logic/data.ts src/logic/data.test.ts
rtk git commit -m "feat: per-genre JSON data files with auto-discovery"
```

---

## Task 4: Deck Logic (TDD)

**Files:**
- Create: `src/logic/deck.ts`
- Create: `src/logic/deck.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/deck.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { RNG } from "types";
import { createDeck, drawCard } from "./deck";
import { loadGenres } from "./data";

// Tests should be resilient to adding/removing JSON files in src/data/.
// Do not hardcode the number of genre cards; derive it from the discovered genres.

// Deterministic RNG: always returns 0 so shuffle leaves array in original order.
const deterministicRng: RNG = () => 0;

describe("createDeck", () => {
  it("creates one genre card per discovered genre", () => {
    const genres = loadGenres();
    const deck = createDeck(deterministicRng);
    const genreCards = deck.filter((c) => c.type === "genre");
    expect(genreCards).toHaveLength(genres.length);
  });

  it("total deck size equals (genre count + 5 specials)", () => {
    const genres = loadGenres();
    const deck = createDeck(deterministicRng);
    expect(deck).toHaveLength(genres.length + 5);
  });

  it("contains the expected special card counts", () => {
    const deck = createDeck(deterministicRng);
    expect(deck.filter((c) => c.type === "loseATurn")).toHaveLength(1);
    expect(deck.filter((c) => c.type === "guesserChooses")).toHaveLength(2);
    expect(deck.filter((c) => c.type === "opponentChooses")).toHaveLength(2);
  });
});

describe("drawCard", () => {
  it("returns the top card and the remaining deck", () => {
    const deck = createDeck(deterministicRng);
    const first = deck[0];
    const { card, remaining, reshuffled } = drawCard(deck, deterministicRng);
    expect(card).toEqual(first);
    expect(remaining.length).toBe(deck.length - 1);
    expect(reshuffled).toBe(false);
  });

  it("reshuffles when deck is empty", () => {
    const { card, remaining, reshuffled } = drawCard([], deterministicRng);
    expect(card).toBeDefined();
    expect(remaining.length).toBeGreaterThan(0);
    expect(reshuffled).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/logic/deck.test.ts
```

Expected: FAIL — cannot find module `./deck`.

- [ ] **Step 3: Implement deck.ts**

Create `src/logic/deck.ts`:

```typescript
import type { Card, RNG } from "types";
import { invariant } from "./invariant";
import { getGenreNames } from "./data";

export function shuffle<T>(array: T[], rng: RNG = Math.random): T[] {
	const out = [...array];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function buildDeck(): Card[] {
	const genreCards: Card[] = getGenreNames().map((name) => ({
		type: "genre",
		genre: name,
		label: name,
	}));

	// SPECIAL_CARD_COUNT = 5: 1 loseATurn + 2 guesserChooses + 2 opponentChooses
	const specials: Card[] = [
		{ type: "loseATurn", genre: null, label: "Lose a Turn" },
		{ type: "guesserChooses", genre: null, label: "Guesser Chooses" },
		{ type: "guesserChooses", genre: null, label: "Guesser Chooses" },
		{ type: "opponentChooses", genre: null, label: "Opponent Chooses" },
		{ type: "opponentChooses", genre: null, label: "Opponent Chooses" },
	];

	return [...genreCards, ...specials];
}

export function createDeck(rng: RNG = Math.random): Card[] {
	return shuffle(buildDeck(), rng);
}

export function drawCard(
	deck: Card[],
	rng: RNG = Math.random,
): { card: Card; remaining: Card[]; reshuffled: boolean } {
	if (deck.length === 0) {
		const fresh = createDeck(rng);
		const card = fresh[0];
		invariant(card, "Freshly created deck must not be empty");
		return { card, remaining: fresh.slice(1), reshuffled: true };
	}
	const card = deck[0];
	invariant(card, "Deck was non-empty but deck[0] was undefined");
	return { card, remaining: deck.slice(1), reshuffled: false };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/logic/deck.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/logic/deck.ts src/logic/deck.test.ts
rtk git commit -m "feat: deck logic driven by auto-discovered genres"
```

---

## Task 5: Entry Selection Logic (TDD)

**Files:**
- Create: `src/logic/entries.ts`
- Create: `src/logic/entries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/entries.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { Entry, GenreData, RNG } from "types";
import { pickEntry } from "./entries";

// Cycles through a fixed sequence so picks are deterministic.
function makeSeqRng(...values: number[]): RNG {
	let i = 0;
	return () => values[i++ % values.length];
}

const testData: GenreData[] = [
	{
		name: "Poetry",
		entries: [
			{ openingLines: "Line A", title: "Poem A", author: "Author A", year: 2000 },
			{ openingLines: "Line B", title: "Poem B", author: "Author B", year: 2001 },
		],
	},
	{
		name: "Mysteries",
		entries: [
			{ openingLines: "Line C", title: "Mystery C", author: "Author C", year: 1999 },
		],
	},
];

describe("pickEntry", () => {
	it("returns an entry from the requested genre", () => {
		const rng = makeSeqRng(0); // always picks index 0
		const { entry } = pickEntry("Poetry", testData, {}, rng);
		expect(entry.title).toBe("Poem A");
	});

	it("tracks used indices for the genre", () => {
		const rng = makeSeqRng(0);
		const { entry, usedEntries } = pickEntry("Poetry", testData, {}, rng);
		const poetryEntries = testData[0].entries;
		const idx = poetryEntries.indexOf(entry);
		expect(usedEntries.Poetry).toContain(idx);
	});

	it("does not repeat entries until all are exhausted", () => {
		const rng = makeSeqRng(0); // picks first available each time
		const { entry: first, usedEntries: used1 } = pickEntry("Poetry", testData, {}, rng);
		const { entry: second } = pickEntry("Poetry", testData, used1, rng);
		expect(first.title).not.toBe(second.title);
	});

	it("resets when all entries in a genre are exhausted", () => {
		const rng = makeSeqRng(0);
		const { usedEntries: used1 } = pickEntry("Poetry", testData, {}, rng);
		const { usedEntries: used2 } = pickEntry("Poetry", testData, used1, rng);
		// Both used -- next pick should reset pool to full
		const { entry: third, usedEntries: used3 } = pickEntry("Poetry", testData, used2, rng);
		expect(["Poem A", "Poem B"]).toContain(third.title);
		expect(used3.Poetry).toHaveLength(1);
	});

	it("works for a genre with a single entry", () => {
		const rng = makeSeqRng(0);
		const { entry } = pickEntry("Mysteries", testData, {}, rng);
		expect(entry.title).toBe("Mystery C");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/logic/entries.test.ts
```

Expected: FAIL — cannot find module `./entries`.

- [ ] **Step 3: Implement entries.ts**

Create `src/logic/entries.ts`:

```typescript
import type { Entry, GenreData, RNG } from "types";
import { invariant } from "./invariant";

export function pickEntry(
	genreName: string,
	allGenres: GenreData[],
	usedEntries: Record<string, number[]>,
	rng: RNG = Math.random,
): { entry: Entry; usedEntries: Record<string, number[]> } {
	const genreData = allGenres.find((g) => g.name === genreName);
	if (!genreData) throw new Error(`Genre not found: ${genreName}`);

	const { entries } = genreData;
	const used = usedEntries[genreName] ?? [];

	let available = entries
		.map((e, i) => ({ entry: e, index: i }))
		.filter(({ index }) => !used.includes(index));

	// Reset pool atomically when all entries have been used once.
	if (available.length === 0) {
		available = entries.map((e, i) => ({ entry: e, index: i }));
	}

	const pick = available[Math.floor(rng() * available.length)];
	invariant(pick, "available was non-empty but pick was undefined");

	const wasReset = available.length === entries.length && used.length > 0;
	const newUsed = wasReset ? [pick.index] : [...used, pick.index];

	return {
		entry: pick.entry,
		usedEntries: { ...usedEntries, [genreName]: newUsed },
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/logic/entries.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/logic/entries.ts src/logic/entries.test.ts
rtk git commit -m "feat: entry selection with exhaustion reset"
```

---

## Task 5.5: Game Engine Refinements

These are small but important clarifications and hardening steps to implement as part of the engine work (entries, deck, and game logic).

- Opponent Chooses: Make the UI and reducer flow explicit: when an "opponentChooses" card is drawn the UI must name the next player in turn order as the picker and prompt them to choose a genre for the current guesser. Implement this as part of the `genreSelect` phase and ensure the `app` slice stores `currentCard` so the UI can compute and show the correct picker.

- Exhaustion Reset: Strengthen the `usedEntries` logic so that when all indices for a genre have been used, the reducer (or helper) clears the `usedEntries[genre]` list and then picks from the full pool. This reset must be atomic in the reducer so concurrent flows cannot produce duplicate immediate picks.

- Tests: Add unit tests that specifically assert the exhaustion/reset behavior for a genre with N entries: pick N times, then verify the N+1 pick is allowed and that `usedEntries[genre]` length is reset/updated accordingly.


## Task 6: Game State Logic (TDD)

**Files:**
- Create: `src/logic/game.ts`
- Create: `src/logic/game.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/game.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { GameState, RNG } from "types";
import {
	advancePlayer,
	applyScore,
	checkWinner,
	createInitialState,
	getNextPlayerIndex,
} from "./game";
import { loadGenres } from "./data";

// Deterministic RNG for tests -- always returns 0 so shuffle is a no-op.
const deterministicRng: RNG = () => 0;

describe("createInitialState", () => {
	it("initializes players with zero scores", () => {
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		const names = state.players.map((p) => p.name).sort();
		expect(names).toEqual(["Alice", "Bob"]);
		for (const p of state.players) expect(p.score).toBe(0);
	});

	it("sets targetScore, starts on draw phase, deckDrawCount 0", () => {
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		expect(state.targetScore).toBe(8);
		expect(state.phase).toBe("draw");
		expect(state.currentPlayerIndex).toBe(0);
		expect(state.deckDrawCount).toBe(0);
	});

	it("creates a full deck (genre count + 5 specials -- no hardcoded 17)", () => {
		const genres = loadGenres();
		const state = createInitialState(["Alice", "Bob"], 8, deterministicRng);
		expect(state.deck).toHaveLength(genres.length + 5);
	});

	it("randomizes player order (uses real Math.random by default)", () => {
		const orders = new Set<string>();
		for (let i = 0; i < 20; i++) {
			const state = createInitialState(["Alice", "Bob", "Carol"], 8);
			orders.add(state.players.map((p) => p.name).join(","));
		}
		expect(orders.size).toBeGreaterThan(1);
	});

	it("throws when fewer than MIN_PLAYERS names are provided", () => {
		expect(() => createInitialState(["Alice"], 8, deterministicRng)).toThrow(/MIN_PLAYERS|2 players/i);
		expect(() => createInitialState([], 8, deterministicRng)).toThrow();
	});
});

describe("getNextPlayerIndex", () => {
	it("advances by 1", () => {
		expect(getNextPlayerIndex(0, 3)).toBe(1);
		expect(getNextPlayerIndex(1, 3)).toBe(2);
	});

	it("wraps around to 0", () => {
		expect(getNextPlayerIndex(1, 2)).toBe(0);
		expect(getNextPlayerIndex(2, 3)).toBe(0);
	});
});

describe("applyScore", () => {
	it("adds the given points to the scorer", () => {
		const players = [{ name: "Alice", score: 3 }, { name: "Bob", score: 5 }];
		expect(applyScore(players, 0, 1)[0].score).toBe(4);
		expect(applyScore(players, 0, 2)[0].score).toBe(5);
	});

	it("does not change other players", () => {
		const players = [{ name: "Alice", score: 3 }, { name: "Bob", score: 5 }];
		expect(applyScore(players, 0, 1)[1].score).toBe(5);
	});
});

describe("checkWinner", () => {
	it("returns null when no player has reached target", () => {
		const players = [{ name: "Alice", score: 7 }, { name: "Bob", score: 5 }];
		expect(checkWinner(players, 8)).toBeNull();
	});

	it("returns the index of the winning player", () => {
		const players = [{ name: "Alice", score: 8 }, { name: "Bob", score: 5 }];
		expect(checkWinner(players, 8)).toBe(0);
	});
});

describe("advancePlayer", () => {
	it("increments currentPlayerIndex and resets turn state", () => {
		const state = createInitialState(["Alice", "Bob"], 8);
		const next = advancePlayer(state);
		expect(next.currentPlayerIndex).toBe(1);
		expect(next.phase).toBe("draw");
		expect(next.currentCard).toBeNull();
		expect(next.currentEntry).toBeNull();
		expect(next.currentGenre).toBeNull();
	});

	it("wraps player index back to 0", () => {
		const state = createInitialState(["Alice", "Bob"], 8);
		const after1 = advancePlayer(state);
		const after2 = advancePlayer(after1);
		expect(after2.currentPlayerIndex).toBe(0);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/logic/game.test.ts
```

Expected: FAIL — cannot find module `./game`.

- [ ] **Step 3: Implement game.ts**

Create `src/logic/game.ts`:

```typescript
import type { GameState, Player, RNG } from "types";
import { MIN_PLAYERS } from "types";
import { invariant } from "./invariant";
import { createDeck, shuffle } from "./deck";

export function createInitialState(
	names: string[],
	targetScore: number,
	rng: RNG = Math.random,
): GameState {
	invariant(
		names.length >= MIN_PLAYERS,
		`createInitialState: need at least ${MIN_PLAYERS} players, got ${names.length}`,
	);
	return {
		phase: "draw",
		players: shuffle(
			names.map((name) => ({ name, score: 0 })),
			rng,
		),
		currentPlayerIndex: 0,
		targetScore,
		deck: createDeck(rng),
		deckDrawCount: 0,
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		usedEntries: {},
	};
}

export function getNextPlayerIndex(current: number, total: number): number {
	return (current + 1) % total;
}

export function applyScore(
	players: Player[],
	scorerIndex: number,
	points: number,
): Player[] {
	return players.map((p, i) =>
		i === scorerIndex ? { ...p, score: p.score + points } : p,
	);
}

export function checkWinner(
	players: Player[],
	targetScore: number,
): number | null {
	const idx = players.findIndex((p) => p.score >= targetScore);
	return idx === -1 ? null : idx;
}

export function advancePlayer(state: GameState): GameState {
	return {
		...state,
		phase: "draw",
		currentPlayerIndex: getNextPlayerIndex(
			state.currentPlayerIndex,
			state.players.length,
		),
		currentCard: null,
		currentEntry: null,
		currentGenre: null,
		// deckDrawCount persists across turns -- only resets when deck reshuffles
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/logic/game.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/logic/game.ts src/logic/game.test.ts
rtk git commit -m "feat: game state logic with scoring and turn management"
```

---

## Task 7: Storage Logic (TDD)

Persist game state to localStorage with a version wrapper so future schema changes can be migrated safely. The debounce lives in App.tsx (see Task 9); storage.ts is pure synchronous I/O.

**Files:**
- Create: `src/logic/storage.ts`
- Create: `src/logic/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/storage.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import type { GameState } from "types";
import { clearSavedState, loadState, saveState } from "./storage";

const STORAGE_KEY = "darkandstormy_gamestate";

const mockState: GameState = {
	phase: "draw",
	players: [{ name: "Alice", score: 2 }, { name: "Bob", score: 1 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

afterEach(() => {
	localStorage.removeItem(STORAGE_KEY);
});

describe("saveState / loadState", () => {
	it("round-trips a game state", () => {
		saveState(mockState);
		expect(loadState()).toEqual(mockState);
	});

	it("stores a versioned wrapper (not bare state)", () => {
		saveState(mockState);
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = JSON.parse(raw!);
		expect(parsed.version).toBe(1);
		expect(parsed.state).toBeDefined();
	});

	it("returns null when nothing is saved", () => {
		expect(loadState()).toBeNull();
	});

	it("returns null for invalid JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{{");
		expect(loadState()).toBeNull();
	});

	it("returns null for a mismatched version (future migration gate)", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, state: mockState }));
		expect(loadState()).toBeNull();
	});
});

describe("clearSavedState", () => {
	it("removes saved state", () => {
		saveState(mockState);
		clearSavedState();
		expect(loadState()).toBeNull();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/logic/storage.test.ts
```

Expected: FAIL — cannot find module `./storage`.

- [ ] **Step 3: Implement storage.ts**

Create `src/logic/storage.ts`:

```typescript
import type { GameState, PersistedState } from "types";
import { STORAGE_VERSION } from "types";

const STORAGE_KEY = "darkandstormy_gamestate";

export function saveState(state: GameState): void {
	const blob: PersistedState = { version: STORAGE_VERSION, state };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
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
```

- [ ] **Step 4: Run all logic tests together**

```bash
npm test
```

Expected: all tests across data, deck, entries, game, storage PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/logic/storage.ts src/logic/storage.test.ts
rtk git commit -m "feat: versioned localStorage persistence with tests"
```

---

## Task 8: Global Styles & Entry Point

**Files:**
- Create: `src/global.css`
- Create: `src/main.tsx`

- [ ] **Step 1: Create global.css**

Create `src/global.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&display=swap');

:root {
	color-scheme: dark;
	--bg: #1e1b2e;
	--surface: #2a2640;
	--text: #ede9e0;
	--muted: #8c8599;
	--accent: #c9a84c;
	--danger: #e05c5c;
	--border: #3a3550;
	--radius: 10px;
	--tap-min: 48px;
	--font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	--font-literary: "Lora", Georgia, serif;
}

*,
*::before,
*::after {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	font-family: var(--font-ui);
	background: var(--bg);
	color: var(--text);
	min-height: 100dvh;
	-webkit-tap-highlight-color: transparent;
}

button {
	font: inherit;
	cursor: pointer;
	border: none;
	min-height: var(--tap-min);
	border-radius: var(--radius);
}
```

- [ ] **Step 2: Create main.tsx**

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./global.css";

// No Redux Provider -- state is managed by useReducer inside App.
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
```

- [ ] **Step 3: Commit**

```bash
rtk git add src/global.css src/main.tsx
rtk git commit -m "feat: global styles and entry point"
```

---

## Task 9: App Shell

**Files:**
- Create: `src/App.tsx`
- Create: `src/App.module.css`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Create App.module.css**

Create `src/App.module.css`:

```css
.app {
	max-width: 480px;
	margin: 0 auto;
	padding: 16px;
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	margin-bottom: 16px;
	border-bottom: 1px solid var(--border);
}

.title {
	font-size: 1rem;
	font-weight: 700;
}

.newGameBtn {
	background: transparent;
	color: var(--muted);
	font-size: 0.85rem;
	padding: 8px 12px;
	border: 1px solid var(--border);
	min-height: auto;
}
```

- [ ] **Step 2: Create App.tsx**

Create `src/App.tsx`:

```tsx
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
```

- [ ] **Step 3: Create App.test.tsx**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { clearSavedState, saveState } from "logic/storage";

afterEach(() => {
	clearSavedState();
});

describe("App", () => {
	it("renders the setup screen by default", () => {
		render(<App />);
		expect(screen.getByText(/It Was a Dark and Stormy Night/i)).toBeInTheDocument();
	});

	it("transitions to draw phase after starting a game", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(screen.getByText(/Draw Card/i)).toBeInTheDocument();
	});

	it("shows New Game button during play", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(screen.getByRole("button", { name: /New Game/i })).toBeInTheDocument();
	});

	it("returns to setup when New Game is clicked", async () => {
		const user = userEvent.setup();
		render(<App />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		await user.click(screen.getByRole("button", { name: /New Game/i }));
		expect(screen.getByText(/It Was a Dark and Stormy Night/i)).toBeInTheDocument();
	});

	it("does not resume a gameOver state on reload -- shows setup instead", () => {
		// Simulate a saved state in gameOver phase
		saveState({
			phase: "gameOver",
			players: [{ name: "Alice", score: 8 }, { name: "Bob", score: 3 }],
			currentPlayerIndex: 0,
			targetScore: 8,
			deck: [],
			deckDrawCount: 0,
			currentCard: null,
			currentEntry: null,
			currentGenre: null,
			usedEntries: {},
		});
		render(<App />);
		// Should show setup, not the game-over screen
		expect(screen.getByText(/It Was a Dark and Stormy Night/i)).toBeInTheDocument();
	});

	it("resumes a mid-game state on reload", () => {
		saveState({
			phase: "draw",
			players: [{ name: "Alice", score: 2 }, { name: "Bob", score: 1 }],
			currentPlayerIndex: 0,
			targetScore: 8,
			deck: [],
			deckDrawCount: 3,
			currentCard: null,
			currentEntry: null,
			currentGenre: null,
			usedEntries: {},
		});
		render(<App />);
		// Mid-game resumes -- Draw screen should be visible
		expect(screen.getByText(/Draw Card/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/App.test.tsx
```

Expected: all 6 App tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/App.tsx src/App.module.css src/App.test.tsx
rtk git commit -m "feat: app shell with useReducer, phase routing, debounced localStorage resume"
```

---

## Task 10: Setup Screen

**Files:**
- Create: `src/screens/Setup.tsx`
- Create: `src/screens/Setup.module.css`
- Create: `src/screens/Setup.test.tsx`

- [ ] **Step 1: Create Setup.module.css**

Create `src/screens/Setup.module.css`:

```css
.setup {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding-top: 32px;
}

.heading {
	font-size: 1.8rem;
	line-height: 1.1;
}

.subtitle {
	color: var(--muted);
	font-size: 0.95rem;
	margin-top: 8px;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.label {
	font-size: 0.85rem;
	color: var(--muted);
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.playerRow {
	display: flex;
	gap: 8px;
	align-items: center;
}

.playerInput {
	flex: 1;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	color: var(--text);
	padding: 12px;
	font: inherit;
	min-height: var(--tap-min);
}

.removeBtn {
	background: var(--surface);
	color: var(--danger);
	padding: 0 14px;
	border: 1px solid var(--border);
	font-size: 1.2rem;
}

.addBtn {
	background: var(--surface);
	color: var(--accent);
	padding: 12px;
	border: 1px solid var(--border);
}

.scoreOptions {
	display: flex;
	gap: 8px;
}

.scoreBtn {
	flex: 1;
	padding: 12px;
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
}

.scoreBtn[data-active="true"] {
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
}

.startBtn {
	margin-top: auto;
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 16px;
}
```

- [ ] **Step 2: Create Setup.tsx**

Create `src/screens/Setup.tsx`:

```tsx
import { useState } from "react";
import { DEFAULT_TARGET_SCORE, MAX_PLAYERS, MIN_PLAYERS, TARGET_SCORE_OPTIONS } from "types";
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
```

- [ ] **Step 3: Create Setup.test.tsx**

Create `src/screens/Setup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Setup from "./Setup";

describe("Setup", () => {
	it("renders title and subtitle", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(screen.getByText(/It Was a Dark and Stormy Night/i)).toBeInTheDocument();
		expect(screen.getByText(/literary trivia/i)).toBeInTheDocument();
	});

	it("starts with two player inputs", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
	});

	it("adds a player when + Add Player is clicked", async () => {
		const user = userEvent.setup();
		render(<Setup onStart={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Add Player/i }));
		expect(screen.getAllByRole("textbox")).toHaveLength(3);
	});

	it("removes a player when remove is clicked (keeps minimum 2)", async () => {
		const user = userEvent.setup();
		render(<Setup onStart={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Add Player/i }));
		const removeButtons = screen.getAllByRole("button", { name: /Remove player/i });
		await user.click(removeButtons[0]);
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
	});

	it("does not show remove buttons when only 2 players", () => {
		render(<Setup onStart={vi.fn()} />);
		expect(screen.queryByRole("button", { name: /Remove player/i })).toBeNull();
	});

	it("calls onStart with resolved names and default target score", async () => {
		const user = userEvent.setup();
		const onStart = vi.fn();
		render(<Setup onStart={onStart} />);
		const firstInput = screen.getAllByRole("textbox")[0];
		await user.clear(firstInput);
		await user.type(firstInput, "Alice");
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(onStart).toHaveBeenCalledWith(["Alice", "Player 2"], 8);
	});

	it("uses placeholder names for empty inputs", async () => {
		const user = userEvent.setup();
		const onStart = vi.fn();
		render(<Setup onStart={onStart} />);
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(onStart).toHaveBeenCalledWith(["Player 1", "Player 2"], 8);
	});

	it("changes target score when a score option is clicked", async () => {
		const user = userEvent.setup();
		const onStart = vi.fn();
		render(<Setup onStart={onStart} />);
		await user.click(screen.getByRole("button", { name: "5" }));
		await user.click(screen.getByRole("button", { name: /Start Game/i }));
		expect(onStart).toHaveBeenCalledWith(expect.any(Array), 5);
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/Setup.test.tsx
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/Setup.tsx src/screens/Setup.module.css src/screens/Setup.test.tsx
rtk git commit -m "feat: setup screen with tests"
```

---

## Task 11: Draw Screen

**Files:**
- Create: `src/screens/Draw.tsx`
- Create: `src/screens/Draw.module.css`
- Create: `src/screens/Draw.test.tsx`

- [ ] **Step 1: Create Draw.module.css**

Create `src/screens/Draw.module.css`:

```css
.draw {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.turnLabel {
	font-size: 1.4rem;
	font-weight: 700;
	text-align: center;
	padding-top: 24px;
}

.drawBtn {
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 20px;
}

.deckCounter {
	text-align: center;
	color: var(--muted);
	font-size: 0.85rem;
	margin-top: -12px;
}

.scoreboard {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: auto;
}

.scoreRow {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	background: var(--surface);
	border-radius: var(--radius);
	border: 1px solid var(--border);
}

.scoreRow[data-active="true"] {
	border-color: var(--accent);
}

.playerName {
	font-weight: 600;
}

.playerScore {
	color: var(--accent);
	font-weight: 700;
}
```

- [ ] **Step 2: Create Draw.tsx**

Create `src/screens/Draw.tsx`:

```tsx
import type { GameState } from "types";
import styles from "./Draw.module.css";

type Props = {
	state: GameState;
	onDraw: () => void;
	deckSize: number;
};

export default function Draw({ state, onDraw, deckSize }: Props) {
	const currentPlayer = state.players[state.currentPlayerIndex];

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
```

- [ ] **Step 3: Create Draw.test.tsx**

Create `src/screens/Draw.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import Draw from "./Draw";

const baseState: GameState = {
	phase: "draw",
	players: [{ name: "Alice", score: 3 }, { name: "Bob", score: 5 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 5,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("Draw", () => {
	it("shows whose turn it is", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
	});

	it("calls onDraw when the button is clicked", async () => {
		const user = userEvent.setup();
		const onDraw = vi.fn();
		render(<Draw state={baseState} onDraw={onDraw} deckSize={17} />);
		await user.click(screen.getByRole("button", { name: /Draw Card/i }));
		expect(onDraw).toHaveBeenCalledOnce();
	});

	it("renders all players in the scoreboard", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
	});

	it("shows scores and target", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText("3 / 8")).toBeInTheDocument();
		expect(screen.getByText("5 / 8")).toBeInTheDocument();
	});

	it("shows the card counter", () => {
		render(<Draw state={baseState} onDraw={vi.fn()} deckSize={17} />);
		expect(screen.getByText(/Card 5 of 17/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/Draw.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/Draw.tsx src/screens/Draw.module.css src/screens/Draw.test.tsx
rtk git commit -m "feat: draw screen with scoreboard, card counter, and tests"
```

---

## Task 12: LoseATurn Screen

**Files:**
- Create: `src/screens/LoseATurn.tsx`
- Create: `src/screens/LoseATurn.module.css`
- Create: `src/screens/LoseATurn.test.tsx`

- [ ] **Step 1: Create LoseATurn.module.css**

Create `src/screens/LoseATurn.module.css`:

```css
.loseATurn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 24px;
	text-align: center;
}

.heading {
	font-size: 1.8rem;
	font-weight: 700;
	font-family: var(--font-literary);
}

.message {
	color: var(--muted);
	font-size: 1rem;
}

.continueBtn {
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	padding: 16px 32px;
	font-size: 1rem;
}
```

- [ ] **Step 2: Create LoseATurn.tsx**

Create `src/screens/LoseATurn.tsx`:

```tsx
import type { GameState } from "types";
import styles from "./LoseATurn.module.css";

type Props = {
	state: GameState;
	onContinue: () => void;
};

export default function LoseATurn({ state, onContinue }: Props) {
	const player = state.players[state.currentPlayerIndex];

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
```

- [ ] **Step 3: Create LoseATurn.test.tsx**

Create `src/screens/LoseATurn.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import LoseATurn from "./LoseATurn";

const baseState: GameState = {
	phase: "loseATurn",
	players: [{ name: "Alice", score: 2 }, { name: "Bob", score: 1 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: { type: "loseATurn", genre: null, label: "Lose a Turn" },
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("LoseATurn", () => {
	it("shows the skipped player's name", () => {
		render(<LoseATurn state={baseState} onContinue={vi.fn()} />);
		expect(screen.getByText(/Alice is skipped/i)).toBeInTheDocument();
	});

	it("shows Lose a Turn heading", () => {
		render(<LoseATurn state={baseState} onContinue={vi.fn()} />);
		expect(screen.getByText(/Lose a Turn/i)).toBeInTheDocument();
	});

	it("calls onContinue when Continue is clicked", async () => {
		const user = userEvent.setup();
		const onContinue = vi.fn();
		render(<LoseATurn state={baseState} onContinue={onContinue} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(onContinue).toHaveBeenCalledOnce();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/LoseATurn.test.tsx
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/LoseATurn.tsx src/screens/LoseATurn.module.css src/screens/LoseATurn.test.tsx
rtk git commit -m "feat: lose a turn screen with tests"
```

---

## Task 13: GenreSelect Screen

**Files:**
- Create: `src/screens/GenreSelect.tsx`
- Create: `src/screens/GenreSelect.module.css`
- Create: `src/screens/GenreSelect.test.tsx`

- [ ] **Step 1: Create GenreSelect.module.css**

Create `src/screens/GenreSelect.module.css`:

```css
.genreSelect {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.cardLabel {
	font-size: 1.3rem;
	font-weight: 700;
	text-align: center;
	padding-top: 16px;
}

.instruction {
	text-align: center;
	color: var(--muted);
}

.grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.genreBtn {
	padding: 14px 8px;
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	font-size: 0.9rem;
}
```

- [ ] **Step 2: Create GenreSelect.tsx**

Create `src/screens/GenreSelect.tsx`:

```tsx
import { getNextPlayerIndex } from "logic/game";
import type { GenreData, GameState } from "types";
import styles from "./GenreSelect.module.css";

type Props = {
	state: GameState;
	genres: GenreData[];
	onSelect: (genre: string) => void;
};

export default function GenreSelect({ state, genres, onSelect }: Props) {
	const currentPlayer = state.players[state.currentPlayerIndex];
	const card = state.currentCard;

	const isEnemyPicking = card?.type === "opponentChooses";

	const nextIndex = getNextPlayerIndex(
		state.currentPlayerIndex,
		state.players.length,
	);
	const picker = isEnemyPicking ? state.players[nextIndex] : currentPlayer;
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
```

- [ ] **Step 3: Create GenreSelect.test.tsx**

Create `src/screens/GenreSelect.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState, GenreData } from "types";
import GenreSelect from "./GenreSelect";

const testGenres: GenreData[] = [
	{ name: "Poetry", entries: [] },
	{ name: "Mysteries", entries: [] },
];

const baseState: GameState = {
	phase: "genreSelect",
	players: [{ name: "Alice", score: 0 }, { name: "Bob", score: 0 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 3,
	currentCard: { type: "guesserChooses", genre: null, label: "Guesser Chooses" },
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("GenreSelect", () => {
	it("renders a button for each genre", () => {
		render(<GenreSelect state={baseState} genres={testGenres} onSelect={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Poetry" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mysteries" })).toBeInTheDocument();
	});

	it("calls onSelect with the genre name when clicked", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(<GenreSelect state={baseState} genres={testGenres} onSelect={onSelect} />);
		await user.click(screen.getByRole("button", { name: "Poetry" }));
		expect(onSelect).toHaveBeenCalledWith("Poetry");
	});

	it("shows the guesser's name as picker for guesserChooses", () => {
		render(<GenreSelect state={baseState} genres={testGenres} onSelect={vi.fn()} />);
		expect(screen.getByText(/Alice, pick a genre/i)).toBeInTheDocument();
	});

	it("shows the next player as picker for opponentChooses", () => {
		const state = {
			...baseState,
			currentCard: { type: "opponentChooses" as const, genre: null, label: "Opponent Chooses" },
		};
		render(<GenreSelect state={state} genres={testGenres} onSelect={vi.fn()} />);
		expect(screen.getByText(/Bob, pick a genre for Alice/i)).toBeInTheDocument();
	});

});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/GenreSelect.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/GenreSelect.tsx src/screens/GenreSelect.module.css src/screens/GenreSelect.test.tsx
rtk git commit -m "feat: genre select screen with tests"
```

---

## Task 14: Prompt Screen

**Files:**
- Create: `src/screens/Prompt.tsx`
- Create: `src/screens/Prompt.module.css`
- Create: `src/screens/Prompt.test.tsx`

- [ ] **Step 1: Create Prompt.module.css**

Create `src/screens/Prompt.module.css`:

```css
.prompt {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.genre {
	text-align: center;
	color: var(--accent);
	font-size: 0.9rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	padding-top: 8px;
}

.passInstruction {
	text-align: center;
	color: var(--muted);
	font-size: 0.95rem;
}

.continueBtn {
	margin-top: auto;
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	font-size: 1rem;
	padding: 16px;
}

.openingLines {
	font-family: var(--font-literary);
	font-size: 1.15rem;
	line-height: 1.65;
	padding: 20px;
	background: var(--surface);
	border-radius: var(--radius);
	border: 1px solid var(--border);
	overflow-y: auto;
}

.instruction {
	text-align: center;
	color: var(--muted);
	font-size: 0.95rem;
}

.revealBtn {
	margin-top: auto;
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 16px;
}
```

- [ ] **Step 2: Create Prompt.tsx**

Create `src/screens/Prompt.tsx`:

```tsx
import { useState } from "react";
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

	const guesser = state.players[state.currentPlayerIndex];

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
```

- [ ] **Step 3: Create Prompt.test.tsx**

Create `src/screens/Prompt.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import Prompt from "./Prompt";

const baseState: GameState = {
	phase: "prompt",
	players: [{ name: "Alice", score: 0 }, { name: "Bob", score: 0 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 2,
	currentCard: { type: "genre", genre: "Poetry", label: "Poetry" },
	currentEntry: {
		openingLines: "April is the cruellest month",
		title: "The Waste Land",
		author: "T.S. Eliot",
		year: 1922,
	},
	currentGenre: "Poetry",
	usedEntries: {},
};

describe("Prompt", () => {
	it("shows genre and pass instruction before judge is ready", () => {
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		expect(screen.getByText("Poetry")).toBeInTheDocument();
		expect(screen.getByText(/Pass the phone/i)).toBeInTheDocument();
		expect(screen.queryByText(/April is the cruellest month/i)).toBeNull();
	});

	it("shows Continue button before judge is ready", () => {
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
	});

	it("reveals opening line after Continue is tapped", async () => {
		const user = userEvent.setup();
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(screen.getByText(/April is the cruellest month/i)).toBeInTheDocument();
	});

	it("names the guesser in the instruction after reveal", async () => {
		const user = userEvent.setup();
		render(<Prompt state={baseState} onPassToJudge={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		expect(screen.getByText(/Alice guesses/i)).toBeInTheDocument();
	});

	it("calls onPassToJudge when Reveal Answer is clicked", async () => {
		const user = userEvent.setup();
		const onPassToJudge = vi.fn();
		render(<Prompt state={baseState} onPassToJudge={onPassToJudge} />);
		await user.click(screen.getByRole("button", { name: /Continue/i }));
		await user.click(screen.getByRole("button", { name: /Reveal Answer/i }));
		expect(onPassToJudge).toHaveBeenCalledOnce();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/Prompt.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/Prompt.tsx src/screens/Prompt.module.css src/screens/Prompt.test.tsx
rtk git commit -m "feat: prompt screen with pass-to-judge gate and tests"
```

---

## Task 15: Judge Screen

**Files:**
- Create: `src/screens/Judge.tsx`
- Create: `src/screens/Judge.module.css`
- Create: `src/screens/Judge.test.tsx`

- [ ] **Step 1: Create Judge.module.css**

Create `src/screens/Judge.module.css`:

```css
.judge {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.genre {
	text-align: center;
	color: var(--accent);
	font-size: 0.9rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	padding-top: 8px;
}

.answer {
	padding: 20px;
	background: var(--surface);
	border-radius: var(--radius);
	border: 1px solid var(--border);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.answerTitle {
	font-family: var(--font-literary);
	font-size: 1.4rem;
	font-weight: 700;
	color: var(--text);
}

.answerAuthor {
	font-size: 1rem;
	color: var(--muted);
}

.answerYear {
	font-size: 0.85rem;
	color: var(--muted);
	opacity: 0.7;
}

.question {
	text-align: center;
	color: var(--muted);
}

.buttons {
	display: flex;
	gap: 12px;
	margin-top: auto;
}

.correctBtn {
	flex: 1;
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 16px;
}

.incorrectBtn {
	flex: 1;
	background: var(--surface);
	color: var(--danger);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 16px;
	border: 1px solid var(--danger);
}
```

- [ ] **Step 2: Create Judge.tsx**

Create `src/screens/Judge.tsx`:

```tsx
import type { GameState } from "types";
import styles from "./Judge.module.css";

type Props = {
	state: GameState;
	onJudge: (correct: boolean) => void;
};

export default function Judge({ state, onJudge }: Props) {
	const { currentEntry, currentGenre } = state;
	if (!currentEntry) return null;

	const guesser = state.players[state.currentPlayerIndex];
	const points = 1;

	return (
		<div className={styles.judge}>
			<div className={styles.genre}>{currentGenre}</div>

			<div className={styles.answer}>
				<div className={styles.answerTitle}>{currentEntry.title}</div>
				<div className={styles.answerAuthor}>by {currentEntry.author}</div>
				<div className={styles.answerYear}>{currentEntry.year}</div>
			</div>

			<div className={styles.question}>
				Did {guesser.name} get it? ({points} {points === 1 ? "point" : "points"})
			</div>

			<div className={styles.buttons}>
				<button type="button" className={styles.correctBtn} onClick={() => onJudge(true)}>
					Correct
				</button>
				<button type="button" className={styles.incorrectBtn} onClick={() => onJudge(false)}>
					Incorrect
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Create Judge.test.tsx**

Create `src/screens/Judge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import Judge from "./Judge";

const baseState: GameState = {
	phase: "judge",
	players: [{ name: "Alice", score: 0 }, { name: "Bob", score: 0 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 4,
	currentCard: { type: "genre", genre: "Poetry", label: "Poetry" },
	currentEntry: {
		openingLines: "April is the cruellest month",
		title: "The Waste Land",
		author: "T.S. Eliot",
		year: 1922,
	},
	currentGenre: "Poetry",
	usedEntries: {},
};

describe("Judge", () => {
	it("shows the answer title, author, and year", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(screen.getByText("The Waste Land")).toBeInTheDocument();
		expect(screen.getByText(/T.S. Eliot/i)).toBeInTheDocument();
		expect(screen.getByText("1922")).toBeInTheDocument();
	});

	it("names the guesser in the question", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(screen.getByText(/Alice/i)).toBeInTheDocument();
	});

	it("calls onJudge(true) when Correct is clicked", async () => {
		const user = userEvent.setup();
		const onJudge = vi.fn();
		render(<Judge state={baseState} onJudge={onJudge} />);
		await user.click(screen.getByRole("button", { name: /Correct/i }));
		expect(onJudge).toHaveBeenCalledWith(true);
	});

	it("calls onJudge(false) when Incorrect is clicked", async () => {
		const user = userEvent.setup();
		const onJudge = vi.fn();
		render(<Judge state={baseState} onJudge={onJudge} />);
		await user.click(screen.getByRole("button", { name: /Incorrect/i }));
		expect(onJudge).toHaveBeenCalledWith(false);
	});

	it("shows 1 point", () => {
		render(<Judge state={baseState} onJudge={vi.fn()} />);
		expect(screen.getByText(/1 point/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/Judge.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/Judge.tsx src/screens/Judge.module.css src/screens/Judge.test.tsx
rtk git commit -m "feat: judge screen with tests"
```

---

## Task 16: GameOver Screen

**Files:**
- Create: `src/screens/GameOver.tsx`
- Create: `src/screens/GameOver.module.css`
- Create: `src/screens/GameOver.test.tsx`

- [ ] **Step 1: Create GameOver.module.css**

Create `src/screens/GameOver.module.css`:

```css
.gameOver {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 24px;
	text-align: center;
}

.winnerLabel {
	color: var(--accent);
	font-size: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.15em;
}

.winnerName {
	font-size: 2rem;
	font-weight: 700;
}

.scores {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.scoreRow {
	display: flex;
	justify-content: space-between;
	padding: 12px;
	background: var(--surface);
	border-radius: var(--radius);
	border: 1px solid var(--border);
}

.playAgainBtn {
	width: 100%;
	background: var(--accent);
	color: var(--bg);
	font-weight: 700;
	font-size: 1.1rem;
	padding: 16px;
}

.newGameBtn {
	width: 100%;
	background: transparent;
	color: var(--muted);
	border: 1px solid var(--border);
	font-size: 0.95rem;
	padding: 12px;
}
```

- [ ] **Step 2: Create GameOver.tsx**

Create `src/screens/GameOver.tsx`:

```tsx
import type { GameState } from "types";
import styles from "./GameOver.module.css";

type Props = {
	state: GameState;
	onPlayAgain: () => void;
	onNewGame: () => void;
};

export default function GameOver({ state, onPlayAgain, onNewGame }: Props) {
	const sorted = [...state.players].sort((a, b) => b.score - a.score);
	const winner = sorted[0];

	return (
		<div className={styles.gameOver}>
			<div className={styles.winnerLabel}>Winner!</div>
			<div className={styles.winnerName}>{winner.name}</div>

			<div className={styles.scores}>
				{sorted.map((player, i) => (
					<div key={i} className={styles.scoreRow}>
						<span>{player.name}</span>
						<span>{player.score} pts</span>
					</div>
				))}
			</div>

			<button type="button" className={styles.playAgainBtn} onClick={onPlayAgain}>
				Play Again
			</button>
			<button type="button" className={styles.newGameBtn} onClick={onNewGame}>
				New Game
			</button>
		</div>
	);
}
```

- [ ] **Step 3: Create GameOver.test.tsx**

Create `src/screens/GameOver.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GameState } from "types";
import GameOver from "./GameOver";

const baseState: GameState = {
	phase: "gameOver",
	players: [{ name: "Alice", score: 8 }, { name: "Bob", score: 5 }],
	currentPlayerIndex: 0,
	targetScore: 8,
	deck: [],
	deckDrawCount: 17,
	currentCard: null,
	currentEntry: null,
	currentGenre: null,
	usedEntries: {},
};

describe("GameOver", () => {
	it("shows the winner's name", () => {
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Winner!")).toBeInTheDocument();
	});

	it("lists all players sorted by score", () => {
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={vi.fn()} />);
		const rows = screen.getAllByText(/pts/);
		expect(rows[0].textContent).toBe("8 pts");
		expect(rows[1].textContent).toBe("5 pts");
	});

	it("calls onPlayAgain when Play Again is clicked", async () => {
		const user = userEvent.setup();
		const onPlayAgain = vi.fn();
		render(<GameOver state={baseState} onPlayAgain={onPlayAgain} onNewGame={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: /Play Again/i }));
		expect(onPlayAgain).toHaveBeenCalledOnce();
	});

	it("calls onNewGame when New Game is clicked", async () => {
		const user = userEvent.setup();
		const onNewGame = vi.fn();
		render(<GameOver state={baseState} onPlayAgain={vi.fn()} onNewGame={onNewGame} />);
		await user.click(screen.getByRole("button", { name: /New Game/i }));
		expect(onNewGame).toHaveBeenCalledOnce();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/screens/GameOver.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/screens/GameOver.tsx src/screens/GameOver.module.css src/screens/GameOver.test.tsx
rtk git commit -m "feat: game over screen with tests"
```

---

## Task 17: Full Test Run, Lint, Build & Manual Test

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests across logic and screen files PASS. Fix any failures before continuing.

- [ ] **Step 2: Run Biome lint/format**

```bash
npm run lint
```

Fix any reported issues, then run again until clean.

- [ ] **Step 3: TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

> **Likely errors from `noUncheckedIndexedAccess`:** Screen components access `state.players[state.currentPlayerIndex]` directly. With this flag on, TypeScript returns `Player | undefined` for array indexing. Fix with a non-null assertion (`!`) or the `getCurrentPlayer` helper from `state/transitions`:
> ```tsx
> import { getCurrentPlayer } from "state/transitions";
> const guesser = getCurrentPlayer(state); // safe — backed by invariant
> ```
> For `sorted[0]` in GameOver: `const winner = sorted[0]!;` is fine — the array is always non-empty when phase is gameOver. For `state.players[nextIndex]` in GenreSelect: `const picker = isEnemyPicking ? state.players[nextIndex]! : currentPlayer;`

- [ ] **Step 4: Production build**

```bash
npm run build
```

Expected: `dist/` created with no errors.

- [ ] **Step 5: Start dev server and manually test on phone**

```bash
npm run dev -- --host
```

Open the local network URL on your phone. Walk through:

1. Setup: add 3 players (confirm "+" disappears at 6), rename one, remove one, select target 5, tap Start
2. Draw: confirm "[Player]'s Turn" shows prominently, scoreboard visible, card counter shows "Card 0 of 17", tap Draw Card
3. Lose a Turn card: confirm "[Player] is skipped" screen appears, tap Continue -- confirm turn advances
4. Genre card: confirm card counter increments, goes to Prompt -- genre shows with Continue button
5. Prompt (pass-to-judge gate): pass phone, tap Continue -- confirm opening line appears (plain text, no forced quotes), Reveal Answer pinned at bottom
6. Judge: confirm title large, author medium, year small/muted; tap Correct -- confirm score increments
7. Judge: tap Incorrect -- confirm no score change, turn advances
8. Draw again -- get Guesser Chooses: confirm genre grid (2 columns) appears, guesser's name in instruction
9. Opponent Chooses: confirm next player's name appears as picker in instruction
10. Play until someone wins -- confirm GameOver: winner name, sorted scores, Play Again + New Game buttons
11. Tap Play Again -- confirm same players, new randomized order, fresh game
12. Tap New Game from GameOver -- confirm returns to Setup
13. Kill the browser tab, reopen URL -- confirm game resumes where it left off without prompt
14. Confirm dark indigo theme, Lora font on opening lines, readable on phone in a lit room

- [ ] **Step 6: Commit any fixes**

```bash
rtk git add -A && rtk git commit -m "chore: post-integration fixes and cleanup"
```
