const NS = "http://www.w3.org/2000/svg";

import type { Phrase, TabNote } from "./fingerings";
import { resolveFingering, resolveNote } from "./fingerings";

export interface TabGridController {
	refresh(keyPosition: number): void;
}

export function buildTabGrid(
	container: HTMLElement,
	phrases: Phrase[],
	keyPosition: number,
	onPhrasesChange: (phrases: Phrase[]) => void,
	onSelect: (phraseIdx: number, noteIdx: number) => void,
): TabGridController {
	let currentKeyPosition = keyPosition;
	const currentPhrases: Phrase[] = phrases.map((p) => ({
		...p,
		notes: [...p.notes],
	}));

	const grid = document.createElement("div");
	grid.className = "tab-grid";
	container.appendChild(grid);

	let dragSrcPhraseIdx = -1;
	let dragSrcNoteIdx = -1;

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

	function deepCopyPhrases(): Phrase[] {
		return currentPhrases.map((p) => ({ ...p, notes: [...p.notes] }));
	}

	function buildCell(
		phraseIdx: number,
		note: TabNote,
		noteIdx: number,
	): HTMLElement {
		const cell = document.createElement("div");
		cell.className = "tab-cell";
		cell.draggable = true;
		cell.dataset.phraseIdx = String(phraseIdx);
		cell.dataset.noteIdx = String(noteIdx);

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
		deleteBtn.setAttribute("aria-label", `Delete note ${noteIdx + 1}`);
		deleteBtn.textContent = "×";
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			currentPhrases[phraseIdx].notes.splice(noteIdx, 1);
			onPhrasesChange(deepCopyPhrases());
			render();
		});
		cell.appendChild(deleteBtn);

		cell.addEventListener("click", () => {
			onSelect(phraseIdx, noteIdx);
			for (const c of grid.querySelectorAll(".tab-cell--selected")) {
				c.classList.remove("tab-cell--selected");
			}
			cell.classList.add("tab-cell--selected");
		});

		cell.addEventListener("dragstart", (e) => {
			dragSrcPhraseIdx = phraseIdx;
			dragSrcNoteIdx = noteIdx;
			cell.classList.add("tab-cell--dragging");
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", `${phraseIdx}:${noteIdx}`);
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
			if (dragSrcPhraseIdx === phraseIdx && dragSrcNoteIdx !== noteIdx) {
				cell.classList.add("tab-cell--drag-over");
			}
		});

		cell.addEventListener("dragleave", () => {
			cell.classList.remove("tab-cell--drag-over");
		});

		cell.addEventListener("drop", (e) => {
			e.preventDefault();
			cell.classList.remove("tab-cell--drag-over");
			if (
				dragSrcPhraseIdx === -1 ||
				dragSrcPhraseIdx !== phraseIdx ||
				dragSrcNoteIdx === noteIdx
			)
				return;
			const notes = currentPhrases[phraseIdx].notes;
			const moved = notes.splice(dragSrcNoteIdx, 1)[0];
			notes.splice(noteIdx, 0, moved);
			dragSrcPhraseIdx = -1;
			dragSrcNoteIdx = -1;
			onPhrasesChange(deepCopyPhrases());
			render();
		});

		return cell;
	}

	function buildInsertMarker(
		phraseIdx: number,
		insertIdx: number,
	): HTMLElement {
		const marker = document.createElement("button");
		marker.type = "button";
		marker.className = "tab-insert-marker";
		marker.setAttribute(
			"aria-label",
			`Insert note at position ${insertIdx + 1}`,
		);
		marker.textContent = "+";
		marker.addEventListener("click", () => {
			currentPhrases[phraseIdx].notes.splice(insertIdx, 0, {
				holes: [true, true, true, true, true, true],
				octave: 0,
			});
			onPhrasesChange(deepCopyPhrases());
			render();
		});
		return marker;
	}

	function renderPhraseNotes(
		phraseIdx: number,
		notesContainer: HTMLElement,
	): void {
		while (notesContainer.firstChild) {
			notesContainer.removeChild(notesContainer.firstChild);
		}
		const phrase = currentPhrases[phraseIdx];
		const notes = phrase.notes;
		const cols = phrase.columns;

		if (notes.length === 0) {
			const row = document.createElement("div");
			row.className = "tab-row";
			row.appendChild(buildInsertMarker(phraseIdx, 0));
			notesContainer.appendChild(row);
			return;
		}

		for (let rowStart = 0; rowStart < notes.length; rowStart += cols) {
			const row = document.createElement("div");
			row.className = "tab-row";
			const rowEnd = Math.min(rowStart + cols, notes.length);
			row.appendChild(buildInsertMarker(phraseIdx, rowStart));
			for (let ni = rowStart; ni < rowEnd; ni++) {
				row.appendChild(buildCell(phraseIdx, notes[ni], ni));
				row.appendChild(buildInsertMarker(phraseIdx, ni + 1));
			}
			notesContainer.appendChild(row);
		}
	}

	function buildPhraseRow(phraseIdx: number): HTMLElement {
		const phrase = currentPhrases[phraseIdx];
		const phraseEl = document.createElement("div");
		phraseEl.className = "tab-phrase";

		const header = document.createElement("div");
		header.className = "tab-phrase-header";

		const label = document.createElement("label");
		label.className = "tab-phrase-columns-label";
		label.textContent = "Columns";

		const columnsInput = document.createElement("input");
		columnsInput.type = "number";
		columnsInput.className = "tab-phrase-columns-input";
		columnsInput.min = "1";
		columnsInput.max = "32";
		columnsInput.value = String(phrase.columns);
		columnsInput.setAttribute("aria-label", "Columns per row");

		const notesContainer = document.createElement("div");
		notesContainer.className = "tab-phrase-notes";

		columnsInput.addEventListener("input", () => {
			const val = Number.parseInt(columnsInput.value, 10);
			if (Number.isNaN(val) || val < 1) return;
			currentPhrases[phraseIdx].columns = val;
			onPhrasesChange(deepCopyPhrases());
			renderPhraseNotes(phraseIdx, notesContainer);
		});

		header.appendChild(label);
		header.appendChild(columnsInput);

		if (currentPhrases.length > 1) {
			const deleteBtn = document.createElement("button");
			deleteBtn.type = "button";
			deleteBtn.className = "tab-phrase-delete";
			deleteBtn.setAttribute("aria-label", `Delete phrase ${phraseIdx + 1}`);
			deleteBtn.textContent = "×";
			deleteBtn.addEventListener("click", () => {
				currentPhrases.splice(phraseIdx, 1);
				onPhrasesChange(deepCopyPhrases());
				render();
			});
			header.appendChild(deleteBtn);
		}

		phraseEl.appendChild(header);

		renderPhraseNotes(phraseIdx, notesContainer);
		phraseEl.appendChild(notesContainer);

		return phraseEl;
	}

	function render(): void {
		while (grid.firstChild) {
			grid.removeChild(grid.firstChild);
		}
		for (let pi = 0; pi < currentPhrases.length; pi++) {
			grid.appendChild(buildPhraseRow(pi));
		}
		const addPhraseBtn = document.createElement("button");
		addPhraseBtn.type = "button";
		addPhraseBtn.className = "tab-add-phrase";
		addPhraseBtn.textContent = "+ Add phrase";
		addPhraseBtn.addEventListener("click", () => {
			currentPhrases.push({ columns: 8, notes: [] });
			onPhrasesChange(deepCopyPhrases());
			render();
		});
		grid.appendChild(addPhraseBtn);
	}

	render();

	return {
		refresh(newKeyPosition: number): void {
			currentKeyPosition = newKeyPosition;
			render();
		},
	};
}
