import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			types: path.resolve(__dirname, "./src/types.ts"),
		},
	},
	test: {
		environment: "happy-dom",
		setupFiles: ["./src/test-setup.ts"],
	},
});
