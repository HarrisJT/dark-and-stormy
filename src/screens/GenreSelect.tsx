import type { GameState, GenreData } from "types";

type Props = { state: GameState; genres: GenreData[]; onSelect: (genre: string) => void };

export default function GenreSelect({ genres, onSelect }: Props) {
	return <div>{genres.map(g => <button key={g.name} type="button" onClick={() => onSelect(g.name)}>{g.name}</button>)}</div>;
}
