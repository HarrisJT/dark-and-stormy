# It Was a Dark and Stormy Night -- Game Design Spec

## Overview

A literary trivia party game played on a single phone, passed between players. Players take turns drawing genre cards, then guessing the title, author, or year of a literary work based on its opening line(s). First player to reach the target score wins.

## Core Mechanics

### Players & Setup

- Minimum 2 players, soft cap of 6
- Setup is a single screen: player names at top, target score selector below, "Start Game" button at bottom
- Players are added via a "+ Add Player" button; each row has an "×" to remove (disabled at 2 players)
- Names default to "Player 1", "Player 2", etc.; tap to rename
- "Start Game" is disabled only when fewer than 2 players exist -- no other validation
- Target score options: 5, 8, 10, or 15 (default 8), displayed as tap-to-select buttons
- Turn order is randomized at game start (and again on Play Again)
- "New Game" button is hidden on the Setup screen (nothing to abandon yet)

### Genres (12)

1. Sci-Fi/Fantasy
2. Shakespeare
3. Children's Books
4. Novels 1950-Present
5. Poetry
6. Movies (source novel that became a well-known film)
7. Novels 1900-1950
8. Non-Fiction
9. Novels Pre-1900
10. Children's Movies (source book behind a well-known kids film)
11. Mysteries
12. Short Stories

### The Deck (17 cards)

12 genre cards (one per genre) plus 5 special cards:

| Card | Count | Effect |
|------|-------|--------|
| Genre card | 12 | Determines the genre for this turn |
| Lose a Turn | 1 | Skip this player's turn |
| Guesser Chooses | 2 | Active player picks any genre |
| Opponent Chooses | 2 | Next player in turn order picks the genre for the guesser |

The deck is shuffled at game start. Cards are drawn from the top. When all 17 cards are drawn, reshuffle and start again.

### Literature Entries

Each genre has its own JSON file in `src/data/`. Adding a new genre is as simple as dropping a new file in the folder -- no code changes required.

Genre file shape (e.g. `data/poetry.json`):

```json
{
  "name": "Poetry",
  "entries": [
    {
      "openingLines": "April is the cruellest month, breeding...",
      "title": "The Waste Land",
      "author": "T.S. Eliot",
      "year": 1922
    }
  ]
}
```

Files are auto-discovered at build time via Vite's `import.meta.glob`. The genre list, deck composition, and genre select screen all derive from whatever JSON files exist in the data folder. No hardcoded genre list.

When a genre is determined, a random entry is picked from that genre's pool without repeating until all entries are exhausted. Exhaustion behavior must be explicit and robust: when every entry in a genre has been used, the slice's `usedEntries[genre]` list must be cleared and selection resumes from the full pool (effectively reshuffling that genre's choices). Implementations should update the `usedEntries` tracker atomically in the reducer (or helper) so there is no race condition that could cause an accidental immediate repeat.

For MVP, ~3 placeholder entries per genre (~36 total). Real curated data will be added later, potentially seeded by AI generation.

### Turn Flow

**Step 1 -- Draw.** Screen shows whose turn it is, the current scoreboard, a card counter ("Card n of 17"), and a "Draw Card" button. Guesser taps to draw.

**Step 2 -- Genre resolution.** Depends on the card:

- **Genre card:** Genre is set, proceed to step 3.
- **Guesser Chooses:** Genre select screen appears. Card label at top, instruction reads "[Guesser], pick a genre." Guesser picks one.
- **Opponent Chooses:** Same genre select screen. Card label at top, instruction reads "[Next player], pick a genre for [Guesser]." Players are trusted to have the right person tap.
- **Lose a Turn:** Dedicated screen shows "[Player] loses a turn!" with a Continue button. Anyone taps Continue to advance.

**Step 3 -- Pass to judge.** After genre is determined, a screen shows the genre name and a Continue button. Guesser passes the phone to any opponent (the judge). Judge taps Continue to see the opening line.

**Step 4 -- Prompt & guess.** Judge reads the opening line(s) aloud. Guesser says their guess verbally (title, author, or year). Judge taps "Reveal Answer" when ready.

**Step 5 -- Judge.** Judge sees title (large), author (medium), year (small/muted). Judge taps "Correct" or "Incorrect" based on the verbal guess.

**Step 6 -- Resolve.**

- Correct: +1 point.
- Incorrect: no points.
- Check win condition. If a player has reached the target score, game over immediately.
- Advance to next player.

### Scoring

- Any one correct element (title OR author OR year) = correct guess
- Correct guess: +1 point
- First to target score wins

## Architecture

### Frontend-Only

No backend. All game logic runs in the browser. Literature data is static JSON files bundled with the app. React + Vite + TypeScript.

### State Management

Game state is managed by React's built-in `useReducer` with a fully typed action union. All game transitions live in `src/state/reducer.ts`; pure logic helpers in `src/logic/` are called from the reducer.

```typescript
type RNG = () => number; // injectable -- tests pass deterministic values, gameplay uses Math.random

type GamePhase = "setup" | "draw" | "loseATurn" | "genreSelect" | "prompt" | "judge" | "gameOver";

type GameState = {
  phase: GamePhase;
  players: { name: string; score: number }[];
  currentPlayerIndex: number;
  targetScore: number;
  deck: Card[];
  deckDrawCount: number;       // cards drawn from current cycle (resets on reshuffle)
  currentCard: Card | null;
  currentEntry: Entry | null;
  currentGenre: string | null;
  usedEntries: Record<string, number[]>; // genre -> indices of used entries
  seed: number | undefined; // seed used at game start; stored so PLAY_AGAIN is deterministic with ?seed=N
};

type Action =
  | { type: "START_GAME"; names: string[]; targetScore: number }
  | { type: "DRAW" }
  | { type: "CONTINUE_LOSE_A_TURN" }
  | { type: "SELECT_GENRE"; genre: string }
  | { type: "PASS_TO_JUDGE" }
  | { type: "JUDGE"; correct: boolean }
  | { type: "PLAY_AGAIN" }
  | { type: "NEW_GAME" };
```

State in App: `GameState | null`. `null` = game not started (Setup screen shown).

Genres are derived at runtime from JSON files in `src/data/`; not from a hardcoded constant. Deck size = `getGenreNames().length + 5` (5 special cards). Adding a genre JSON file grows the deck automatically.

Key implementation notes:

- `phase` determines which screen renders (conditional rendering, no router).
- State is persisted to `localStorage` (key: `"darkandstormy_gamestate"`) as `{ version: 1, state: GameState }` via a 150ms debounced `useEffect` in App.tsx. Debounce prevents thrashing; the version field is a migration gate.
- On load: `useReducer` lazy initializer reads localStorage; if `version !== STORAGE_VERSION` the state is discarded. App resumes immediately otherwise, no prompt.
- `App.tsx` owns `[state, dispatch]`; screens receive state and handler props (no global store, no context).
- All random operations (`shuffle`, `pickEntry`, `createDeck`) accept an optional `RNG` parameter defaulting to `Math.random`. Tests pass `() => 0` or a sequenced RNG to get deterministic results.

Testing notes:

- `src/test-setup.ts` imports `@testing-library/jest-dom` for DOM matchers like `toBeInTheDocument()`.
- Never hardcode numeric deck/genre counts (e.g., `17`, `12`). Use `loadGenres().length + 5` so adding a JSON file doesn't break tests.

### Tooling

- **Zod** (`zod`) for genre JSON schema validation at load time
- **Biome** for linting and formatting (replaces ESLint + Prettier)
- **CSS Modules** for component-scoped styling (built into Vite, no extra deps)
- **Vite** for dev server and bundling
- **Vitest** for unit and component tests
- **happy-dom** as the test environment (fast, no real browser)
- **@testing-library/react** + **@testing-library/user-event** + **@testing-library/jest-dom** for component tests

### Project Structure

No `frontend/` wrapper -- standard Vite layout with `src/` at repo root.

```
audscript/
  src/
    App.tsx              -- useReducer, debounced persistence, phase-driven rendering
    App.module.css
    state/
      reducer.ts         -- typed Action union + gameReducer (calls logic/ helpers)
    screens/
      Setup.tsx          -- dynamic player list, target score, start
      Setup.module.css
      Draw.tsx           -- whose turn, scoreboard, card counter, draw button
      Draw.module.css
      LoseATurn.tsx      -- "[Player] loses a turn!", continue button
      LoseATurn.module.css
      GenreSelect.tsx    -- genre picker (Guesser/Opponent Chooses)
      GenreSelect.module.css
      Prompt.tsx         -- pass-to-judge gate (genre + continue), then opening line + reveal
      Prompt.module.css
      Judge.tsx          -- answer reveal, correct/incorrect
      Judge.module.css
      GameOver.tsx       -- winner, scores, play again / new game
      GameOver.module.css
    data/                -- one JSON file per genre, auto-discovered + Zod-validated
      sci-fi-fantasy.json
      shakespeare.json
      childrens-books.json
      novels-1950-present.json
      poetry.json
      movies.json
      novels-1900-1950.json
      non-fiction.json
      novels-pre-1900.json
      childrens-movies.json
      mysteries.json
      short-stories.json
    logic/
      deck.ts            -- shuffle(rng), createDeck(rng), drawCard(rng)
      game.ts            -- createInitialState(rng), advancePlayer, applyScore, checkWinner
      entries.ts         -- pickEntry(rng) with exhaustion reset
      data.ts            -- auto-discover + Zod-validate genre files
      storage.ts         -- saveState (versioned), loadState, clearSavedState
    types.ts             -- shared types (RNG, GameState, Action, PersistedState, constants)
    main.tsx             -- React entry point
    global.css           -- minimal reset + CSS variables
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  biome.json
  docs/
  README.md
```

## UI Principles

- Mobile-first, large tap targets; `max-width: 480px` centered for desktop
- Simple, quick animations are acceptable -- don't force them, but don't avoid them
- Deep indigo dark theme, friendly not gloomy. Color palette (CSS variables):
  - `--bg: #1e1b2e` / `--surface: #2a2640` / `--text: #ede9e0` / `--muted: #8c8599`
  - `--accent: #c9a84c` / `--danger: #e05c5c` / `--border: #3a3550` / `--radius: 10px`
- Typography: Lora (Google Font) for literary elements (opening lines, headings); system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) for UI chrome
- Each phase is a single full-screen view -- no split layouts, no sidebars
- Opening lines: plain text, never truncated, scrollable if long; Reveal Answer button pinned to bottom
- Judge answer: title large and prominent, author medium below, year small and muted
- Scoreboard visible on draw phase; "New Game" button in header during active play only
- GameOver screen has two buttons: "Play Again" (same players + target score, re-randomized order) and "New Game" (back to setup)

## Out of Scope (MVP)

- Network multiplayer
- Persistent game history / stats
- AI-generated content at runtime
- Sound effects
- Timer per guess
- Difficulty levels
- Backend / database
