const NS = "http://www.w3.org/2000/svg";

import type { TabNote } from "./fingerings";
import { resolveFingering, resolveNote } from "./fingerings";

export interface TabGridController {
	refresh(keyPosition: number): void;
}

export function buildTabGrid(
	container: HTMLElement,
	notes: TabNote[],
	keyPosition: number,
	onNotesChange: (notes: TabNote[]) => void,
	onSelect: (index: number) => void,
): TabGridController {
	let currentKeyPosition = keyPosition;

	const grid = document.createElement("div");
	grid.className = "tab-grid";
	container.appendChild(grid);

	let dragSrcIndex = -1;

	function buildMiniWhistle(holes: boolean[]): SVGSVGElement {
		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("viewBox", "0 0 20 80");
		svg.setAttribute("width", "20");
		svg.setAttribute("height", "80");
		svg.setAttribute("aria-hidden", "true");

		const body = document.createElementNS(NS, "rect");
		body.setAttribute("x", "4");
		body.setAttribute("y", "0");
		body.setAttribute("width", "12");
		body.setAttribute("height", "80");
		body.setAttribute("rx", "6");
		body.classList.add("mini-whistle-body");
		svg.appendChild(body);

		for (let i = 0; i < 6; i++) {
			const cy = 10 + i * 12;
			const circle = document.createElementNS(NS, "circle");
			circle.setAttribute("cx", "10");
			circle.setAttribute("cy", String(cy));
			circle.setAttribute("r", "4");
			circle.classList.add("mini-hole");
			if (holes[i]) circle.classList.add("mini-hole--covered");
			svg.appendChild(circle);
		}

		return svg;
	}

	function buildCell(note: TabNote, index: number): HTMLElement {
		const cell = document.createElement("div");
		cell.className = "tab-cell";
		cell.draggable = true;
		cell.dataset.index = String(index);

		const entry = resolveFingering(note.holes, note.octave);
		if (!entry) cell.classList.add("tab-cell--invalid");

		const miniWhistle = buildMiniWhistle(note.holes);
		cell.appendChild(miniWhistle);

		const label = document.createElement("span");
		label.className = "tab-cell-label";
		if (entry) {
			label.textContent = resolveNote(
				entry.semitone,
				entry.octave,
				currentKeyPosition,
			);
		} else {
			label.textContent = "?";
			label.classList.add("note-name--invalid");
		}
		cell.appendChild(label);

		const deleteBtn = document.createElement("button");
		deleteBtn.type = "button";
		deleteBtn.className = "tab-cell-delete";
		deleteBtn.setAttribute("aria-label", `Delete note ${index + 1}`);
		deleteBtn.textContent = "×";
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			notes.splice(index, 1);
			onNotesChange([...notes]);
			render();
		});
		cell.appendChild(deleteBtn);

		cell.addEventListener("click", () => {
			onSelect(index);
			for (const c of grid.querySelectorAll(".tab-cell--selected")) {
				c.classList.remove("tab-cell--selected");
			}
			cell.classList.add("tab-cell--selected");
		});

		cell.addEventListener("dragstart", (e) => {
			dragSrcIndex = index;
			cell.classList.add("tab-cell--dragging");
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", String(index));
			}
		});

		cell.addEventListener("dragend", () => {
			cell.classList.remove("tab-cell--dragging");
			for (const c of grid.querySelectorAll(".tab-cell--drag-over")) {
				c.classList.remove("tab-cell--drag-over");
			}
		});

		cell.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
			if (dragSrcIndex !== index) cell.classList.add("tab-cell--drag-over");
		});

		cell.addEventListener("dragleave", () => {
			cell.classList.remove("tab-cell--drag-over");
		});

		cell.addEventListener("drop", (e) => {
			e.preventDefault();
			cell.classList.remove("tab-cell--drag-over");
			if (dragSrcIndex === -1 || dragSrcIndex === index) return;
			const moved = notes.splice(dragSrcIndex, 1)[0];
			notes.splice(index, 0, moved);
			dragSrcIndex = -1;
			onNotesChange([...notes]);
			render();
		});

		return cell;
	}

	function buildInsertMarker(index: number): HTMLElement {
		const marker = document.createElement("button");
		marker.type = "button";
		marker.className = "tab-insert-marker";
		marker.setAttribute("aria-label", `Insert note at position ${index + 1}`);
		marker.textContent = "+";
		marker.addEventListener("click", () => {
			notes.splice(index, 0, {
				holes: [true, true, true, true, true, true],
				octave: 0,
			});
			onNotesChange([...notes]);
			render();
		});
		return marker;
	}

	function render(): void {
		while (grid.firstChild) {
			grid.removeChild(grid.firstChild);
		}

		if (notes.length === 0) {
			return;
		}

		grid.appendChild(buildInsertMarker(0));

		for (let i = 0; i < notes.length; i++) {
			grid.appendChild(buildCell(notes[i], i));
			grid.appendChild(buildInsertMarker(i + 1));
		}
	}

	render();

	return {
		refresh(newKeyPosition: number): void {
			currentKeyPosition = newKeyPosition;
			render();
		},
	};
}
