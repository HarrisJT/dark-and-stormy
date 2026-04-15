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
