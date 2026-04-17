// Tilt-press: button leans toward the tap point, springs back on release.
// Installs document-level pointer listeners; returns a disposer.
export function installButtonTilt(): () => void {
	let pressedBtn: HTMLButtonElement | null = null;

	function releaseBtn(transition: string) {
		if (!pressedBtn) return;
		pressedBtn.style.transition = transition;
		pressedBtn.style.transform = "";
		pressedBtn.style.willChange = "";
		pressedBtn = null;
	}

	function onDown(e: PointerEvent) {
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
	}

	const onUp = () =>
		releaseBtn("transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)");
	const onCancel = () => releaseBtn("transform 0.25s ease");

	document.addEventListener("pointerdown", onDown);
	document.addEventListener("pointerup", onUp);
	document.addEventListener("pointercancel", onCancel);

	return () => {
		document.removeEventListener("pointerdown", onDown);
		document.removeEventListener("pointerup", onUp);
		document.removeEventListener("pointercancel", onCancel);
	};
}
