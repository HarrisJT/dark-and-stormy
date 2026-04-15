import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./global.css";

// Tilt-press: button leans toward the tap point, springs back on release.
let pressedBtn: HTMLButtonElement | null = null;

function releaseBtn(transition: string) {
	if (!pressedBtn) return;
	pressedBtn.style.transition = transition;
	pressedBtn.style.transform = "";
	pressedBtn.style.willChange = "";
	pressedBtn = null;
}

document.addEventListener("pointerdown", (e) => {
	const btn = (e.target as Element).closest(
		"button",
	) as HTMLButtonElement | null;
	if (!btn || btn.disabled) return;
	pressedBtn = btn;
	const rect = btn.getBoundingClientRect();
	const dx = (e.clientX - rect.left) / rect.width - 0.5;
	const dy = (e.clientY - rect.top) / rect.height - 0.5;
	btn.style.willChange = "transform";
	btn.style.transition = "transform 0.08s ease-out";
	btn.style.transform = `perspective(600px) rotateY(${dx * 10}deg) rotateX(${-dy * 10}deg) scale(0.96)`;
});

document.addEventListener("pointerup", () =>
	releaseBtn("transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)"),
);
document.addEventListener("pointercancel", () =>
	releaseBtn("transform 0.25s ease"),
);
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
