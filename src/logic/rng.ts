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
