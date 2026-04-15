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
