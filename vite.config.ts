import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite doesn't automatically pick up tsconfig baseUrl for runtime imports.
// type-only imports (import type) are erased and don't need resolution,
// but value imports (import { FOO } from "types") do. We alias the src dir
// so all bare imports matching tsconfig's baseUrl: "./src" resolve correctly.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			types: path.resolve(__dirname, "src/types.ts"),
			logic: path.resolve(__dirname, "src/logic"),
			state: path.resolve(__dirname, "src/state"),
			screens: path.resolve(__dirname, "src/screens"),
		},
	},
	test: {
		environment: "happy-dom",
		setupFiles: ["./src/test-setup.ts"],
	},
});
