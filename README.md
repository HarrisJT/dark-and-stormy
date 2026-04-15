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
