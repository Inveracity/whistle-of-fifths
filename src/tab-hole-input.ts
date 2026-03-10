import type { TabNote } from "./fingerings";
import { resolveFingering, resolveNote } from "./fingerings";

const NS = "http://www.w3.org/2000/svg";

export interface HoleInputController {
	setKeyPosition(pos: number): void;
	setHoles(holes: boolean[], octave: 0 | 1): void;
}

export function buildHoleInput(
	container: HTMLElement,
	keyPosition: number,
	onAdd: (note: TabNote) => void,
): HoleInputController {
	const currentHoles: [boolean, boolean, boolean, boolean, boolean, boolean] = [
		true,
		true,
		true,
		true,
		true,
		true,
	];
	let currentOctave: 0 | 1 = 0;
	let currentKeyPosition = keyPosition;

	const wrapper = document.createElement("div");
	wrapper.className = "hole-input-wrapper";

	const whistleBody = document.createElement("div");
	whistleBody.className = "whistle-body";

	const holeCircles: SVGCircleElement[] = [];
	const holeButtons: HTMLButtonElement[] = [];

	for (let i = 0; i < 6; i++) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "hole hole--covered";
		btn.setAttribute("aria-label", `Hole ${i + 1}`);
		btn.setAttribute("aria-pressed", "true");

		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("viewBox", "0 0 32 32");
		svg.setAttribute("width", "32");
		svg.setAttribute("height", "32");
		svg.setAttribute("aria-hidden", "true");

		const circle = document.createElementNS(NS, "circle");
		circle.setAttribute("cx", "16");
		circle.setAttribute("cy", "16");
		circle.setAttribute("r", "12");
		circle.classList.add("hole-circle");

		svg.appendChild(circle);
		btn.appendChild(svg);

		btn.addEventListener("click", () => {
			currentHoles[i] = !currentHoles[i];
			update();
		});

		holeButtons.push(btn);
		holeCircles.push(circle);
		whistleBody.appendChild(btn);
	}

	const controls = document.createElement("div");
	controls.className = "hole-input-controls";

	const octaveToggle = document.createElement("div");
	octaveToggle.className = "tabs-mode-toggle tabs-mode-toggle--vertical";

	const octaveLowBtn = document.createElement("button");
	octaveLowBtn.type = "button";
	octaveLowBtn.className = "nav-btn nav-btn--active";
	octaveLowBtn.textContent = "Low";
	octaveLowBtn.addEventListener("click", () => {
		currentOctave = 0;
		update();
	});

	const octaveHighBtn = document.createElement("button");
	octaveHighBtn.type = "button";
	octaveHighBtn.className = "nav-btn";
	octaveHighBtn.textContent = "High";
	octaveHighBtn.addEventListener("click", () => {
		currentOctave = 1;
		update();
	});

	octaveToggle.appendChild(octaveLowBtn);
	octaveToggle.appendChild(octaveHighBtn);

	const noteDisplay = document.createElement("div");
	noteDisplay.className = "note-name";

	const addBtn = document.createElement("button");
	addBtn.type = "button";
	addBtn.className = "selector-btn selector-btn--active";
	addBtn.textContent = "Add note";
	addBtn.addEventListener("click", () => {
		const entry = resolveFingering(currentHoles, currentOctave);
		if (entry) {
			onAdd({
				holes: [...currentHoles] as TabNote["holes"],
				octave: currentOctave,
			});
		}
	});

	controls.appendChild(octaveToggle);
	controls.appendChild(noteDisplay);
	controls.appendChild(addBtn);

	wrapper.appendChild(whistleBody);
	wrapper.appendChild(controls);
	container.appendChild(wrapper);

	function update(): void {
		for (let i = 0; i < 6; i++) {
			holeButtons[i].classList.toggle("hole--covered", currentHoles[i]);
			holeButtons[i].setAttribute("aria-pressed", String(currentHoles[i]));
		}

		octaveLowBtn.classList.toggle("nav-btn--active", currentOctave === 0);
		octaveHighBtn.classList.toggle("nav-btn--active", currentOctave === 1);

		const entry = resolveFingering(currentHoles, currentOctave);
		if (entry) {
			noteDisplay.textContent = resolveNote(
				entry.semitone,
				entry.octave,
				currentKeyPosition,
			);
			noteDisplay.classList.remove("note-name--invalid");
			addBtn.disabled = false;
		} else {
			noteDisplay.textContent = "Invalid fingering";
			noteDisplay.classList.add("note-name--invalid");
			addBtn.disabled = true;
		}
	}

	update();

	return {
		setKeyPosition(pos: number): void {
			currentKeyPosition = pos;
			update();
		},
		setHoles(holes: boolean[], octave: 0 | 1): void {
			for (let i = 0; i < 6; i++) {
				currentHoles[i] = holes[i] ?? false;
			}
			currentOctave = octave;
			update();
		},
	};
}
