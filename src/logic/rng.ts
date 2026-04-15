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
