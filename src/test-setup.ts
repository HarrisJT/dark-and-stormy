import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

expect.extend(jestDomMatchers);

// Automatically unmount and clean up after each test.
// Required when Vitest globals are not enabled (no globalThis.afterEach shim).
afterEach(() => {
	cleanup();
});
