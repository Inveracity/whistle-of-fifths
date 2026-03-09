import { WHISTLES } from "./data";
import type { TabNote, TabState } from "./fingerings";
import { buildSelector } from "./selector";
import type { TabGridController } from "./tab-grid";
import { buildTabGrid } from "./tab-grid";
import type { HoleInputController } from "./tab-hole-input";
import { buildHoleInput } from "./tab-hole-input";
import type { TextInputController } from "./tab-text-input";
import { buildTextInput } from "./tab-text-input";

export function buildTabsPage(container: HTMLElement): void {
	const state: TabState = {
		keyPosition: WHISTLES.find((w) => w.label === "D")?.position ?? 2,
		notes: [] as TabNote[],
		inputMode: "visual",
	};

	const page = document.createElement("div");
	page.className = "tabs-page";

	const keyRow = document.createElement("div");
	keyRow.className = "tabs-key-row";

	const keyLabel = document.createElement("span");
	keyLabel.className = "selector-label";
	keyLabel.textContent = "Whistle key";

	const keySelector = document.createElement("div");
	keySelector.className = "selector";

	const setActiveKey = buildSelector(keySelector, (position) => {
		state.keyPosition = position;
		onStateChange();
	});

	setActiveKey(state.keyPosition);
	keyRow.appendChild(keyLabel);
	keyRow.appendChild(keySelector);

	const modeToggle = document.createElement("div");
	modeToggle.className = "tabs-mode-toggle";

	const modes: Array<{ id: TabState["inputMode"]; label: string }> = [
		{ id: "visual", label: "Visual" },
		{ id: "text", label: "Text" },
	];

	const modeButtons = new Map<TabState["inputMode"], HTMLButtonElement>();

	for (const { id, label } of modes) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "nav-btn";
		btn.textContent = label;
		btn.dataset.mode = id;
		btn.addEventListener("click", () => {
			state.inputMode = id;
			setActiveMode(id);
			renderInputPanel();
		});
		modeButtons.set(id, btn);
		modeToggle.appendChild(btn);
	}

	function setActiveMode(mode: TabState["inputMode"]): void {
		for (const [id, btn] of modeButtons) {
			btn.classList.toggle("nav-btn--active", id === mode);
		}
	}

	setActiveMode(state.inputMode);

	const inputPanel = document.createElement("div");
	inputPanel.className = "tabs-input-panel";

	let holeInputRef: HoleInputController | null = null;
	let gridRef: TabGridController | null = null;
	let textInputRef: TextInputController | null = null;

	const gridContainer = document.createElement("div");
	gridContainer.className = "tabs-grid-container";

	const actionsRow = document.createElement("div");
	actionsRow.className = "tabs-actions";

	const shareBtn = document.createElement("button");
	shareBtn.type = "button";
	shareBtn.className = "selector-btn";
	shareBtn.textContent = "Share";
	shareBtn.addEventListener("click", () => {
		onShare();
	});

	actionsRow.appendChild(shareBtn);

	page.appendChild(keyRow);
	page.appendChild(modeToggle);
	page.appendChild(inputPanel);
	page.appendChild(gridContainer);
	page.appendChild(actionsRow);
	container.appendChild(page);

	function renderInputPanel(): void {
		while (inputPanel.firstChild) {
			inputPanel.removeChild(inputPanel.firstChild);
		}
		holeInputRef = null;
		textInputRef = null;

		if (state.inputMode === "visual") {
			holeInputRef = buildHoleInput(inputPanel, state.keyPosition, (note) => {
				state.notes.push(note);
				renderGrid();
			});
		} else {
			textInputRef = buildTextInput(inputPanel, state.keyPosition, (notes) => {
				state.notes = notes;
				renderGrid();
			});
			textInputRef.setValue(state.notes, state.keyPosition);
		}
	}

	function renderGrid(): void {
		while (gridContainer.firstChild) {
			gridContainer.removeChild(gridContainer.firstChild);
		}
		gridRef = buildTabGrid(
			gridContainer,
			state.notes,
			state.keyPosition,
			(updated) => {
				state.notes = updated;
			},
			(index) => {
				holeInputRef?.setHoles(
					[...state.notes[index].holes],
					state.notes[index].octave,
				);
			},
		);
	}

	function onStateChange(): void {
		holeInputRef?.setKeyPosition(state.keyPosition);
		textInputRef?.setKeyPosition(state.keyPosition);
		gridRef?.refresh(state.keyPosition);
	}

	function onShare(): void {
		const encoded = btoa(JSON.stringify(state));
		const url = `${window.location.origin}${window.location.pathname}#tabs?data=${encoded}`;
		window.location.hash = `tabs?data=${encoded}`;
		navigator.clipboard.writeText(url).catch(() => {});
	}

	renderInputPanel();
	renderGrid();
}
