// Asserts a condition and throws if it's falsy.
// Use at phase boundaries to catch impossible states early:
//   invariant(state.currentEntry, "Expected entry in prompt phase");
export function invariant(
	condition: unknown,
	message: string,
): asserts condition {
	if (!condition) {
		throw new Error(`Invariant failed: ${message}`);
	}
}
