import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./global.css";

// No Redux Provider -- state is managed by useReducer inside App.
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
