import { WHISTLES } from "./data";

export function buildSelector(
	container: HTMLElement,
	onChange: (position: number) => void,
): (position: number) => void {
	const buttons: HTMLButtonElement[] = [];

	WHISTLES.forEach((whistle) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = whistle.label;
		btn.dataset.position = String(whistle.position);
		btn.classList.add("selector-btn");

		btn.addEventListener("click", () => {
			buttons.forEach((b) => {
				b.classList.remove("selector-btn--active");
			});
			btn.classList.add("selector-btn--active");
			onChange(whistle.position);
		});

		buttons.push(btn);
		container.appendChild(btn);
	});

	return (position: number) => {
		buttons.forEach((b) => {
			b.classList.toggle(
				"selector-btn--active",
				Number(b.dataset.position) === position,
			);
		});
	};
}
