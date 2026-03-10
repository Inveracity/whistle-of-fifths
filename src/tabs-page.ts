import { WHISTLES } from "./data";
import type { Phrase, TabState } from "./fingerings";
import { buildSelector } from "./selector";
import type { TabGridController } from "./tab-grid";
import { buildTabGrid } from "./tab-grid";
import type { HoleInputController } from "./tab-hole-input";
import { buildHoleInput } from "./tab-hole-input";
import type { TextInputController } from "./tab-text-input";
import { buildTextInput } from "./tab-text-input";

function isValidNote(n: unknown): n is { holes: boolean[]; octave: 0 | 1 } {
	if (typeof n !== "object" || n === null) return false;
	const note = n as Record<string, unknown>;
	if (!Array.isArray(note.holes) || note.holes.length !== 6) return false;
	if (!note.holes.every((h: unknown) => typeof h === "boolean")) return false;
	if (note.octave !== 0 && note.octave !== 1) return false;
	return true;
}

function isValidPhrase(p: unknown): p is Phrase {
	if (typeof p !== "object" || p === null) return false;
	const phrase = p as Record<string, unknown>;
	if (
		typeof phrase.columns !== "number" ||
		!Number.isInteger(phrase.columns) ||
		phrase.columns < 1
	)
		return false;
	if (!Array.isArray(phrase.notes) || !phrase.notes.every(isValidNote))
		return false;
	return true;
}

export function decodeTabState(encoded: string): TabState | null {
	try {
		const parsed: unknown = JSON.parse(atob(encoded));
		if (typeof parsed !== "object" || parsed === null) return null;
		const s = parsed as Record<string, unknown>;
		if (
			typeof s.keyPosition !== "number" ||
			!Number.isInteger(s.keyPosition) ||
			s.keyPosition < 0 ||
			s.keyPosition > 11
		)
			return null;
		const inputMode =
			s.inputMode === "text" ? "text" : ("visual" as TabState["inputMode"]);
		let phrases: Phrase[];
		if (Array.isArray(s.phrases)) {
			if (!s.phrases.every(isValidPhrase)) return null;
			phrases = s.phrases;
		} else if (Array.isArray(s.notes) && s.notes.every(isValidNote)) {
			phrases = [{ columns: 8, notes: s.notes }];
		} else {
			return null;
		}
		return {
			keyPosition: s.keyPosition,
			phrases,
			inputMode,
			title: typeof s.title === "string" ? s.title : "",
		};
	} catch {
		return null;
	}
}

export function buildTabsPage(
	container: HTMLElement,
	initialState?: TabState | null,
): void {
	const state: TabState = initialState ?? {
		keyPosition: WHISTLES.find((w) => w.label === "D")?.position ?? 2,
		phrases: [{ columns: 8, notes: [] }],
		inputMode: "visual",
		title: "",
	};

	let activePhraseIdx = 0;

	const page = document.createElement("div");
	page.className = "tabs-page";

	const titleInput = document.createElement("input");
	titleInput.type = "text";
	titleInput.className = "tabs-title-input";
	titleInput.placeholder = "Untitled piece";
	titleInput.value = state.title;
	titleInput.setAttribute("aria-label", "Piece title");
	titleInput.addEventListener("input", () => {
		state.title = titleInput.value;
	});

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

	page.appendChild(titleInput);
	page.appendChild(gridContainer);
	page.appendChild(actionsRow);

	const inputBar = document.createElement("div");
	inputBar.className = "tabs-input-bar";

	const inputBarHandle = document.createElement("div");
	inputBarHandle.className = "tabs-input-bar-handle";

	const chevronBtn = document.createElement("button");
	chevronBtn.type = "button";
	chevronBtn.className = "tabs-input-chevron";
	chevronBtn.setAttribute("aria-label", "Collapse input");
	chevronBtn.setAttribute("aria-expanded", "true");

	const chevronSvg = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"svg",
	);
	chevronSvg.setAttribute("viewBox", "0 0 24 24");
	chevronSvg.setAttribute("width", "20");
	chevronSvg.setAttribute("height", "20");
	chevronSvg.setAttribute("aria-hidden", "true");
	chevronSvg.setAttribute("fill", "none");
	chevronSvg.setAttribute("stroke", "currentColor");
	chevronSvg.setAttribute("stroke-width", "2");
	chevronSvg.setAttribute("stroke-linecap", "round");
	chevronSvg.setAttribute("stroke-linejoin", "round");

	const chevronPath = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"polyline",
	);
	chevronPath.setAttribute("points", "6 9 12 15 18 9");
	chevronSvg.appendChild(chevronPath);
	chevronBtn.appendChild(chevronSvg);

	const inputContent = document.createElement("div");
	inputContent.className = "tabs-input-content";

	inputContent.appendChild(modeToggle);
	inputContent.appendChild(inputPanel);
	inputContent.appendChild(keyRow);

	let collapsed = false;
	chevronBtn.addEventListener("click", () => {
		collapsed = !collapsed;
		inputBar.classList.toggle("tabs-input-bar--collapsed", collapsed);
		chevronBtn.setAttribute(
			"aria-label",
			collapsed ? "Expand input" : "Collapse input",
		);
		chevronBtn.setAttribute("aria-expanded", String(!collapsed));
	});

	inputBarHandle.appendChild(chevronBtn);
	inputBar.appendChild(inputBarHandle);
	inputBar.appendChild(inputContent);
	page.appendChild(inputBar);
	container.appendChild(page);

	function renderInputPanel(): void {
		while (inputPanel.firstChild) {
			inputPanel.removeChild(inputPanel.firstChild);
		}
		holeInputRef = null;
		textInputRef = null;

		if (state.inputMode === "visual") {
			holeInputRef = buildHoleInput(inputPanel, state.keyPosition, (note) => {
				state.phrases[activePhraseIdx].notes.push(note);
				renderGrid();
			});
		} else {
			textInputRef = buildTextInput(
				inputPanel,
				state.keyPosition,
				(phrases) => {
					state.phrases = phrases;
					renderGrid();
				},
			);
			textInputRef.setValue(state.phrases, state.keyPosition);
		}
	}

	function renderGrid(): void {
		while (gridContainer.firstChild) {
			gridContainer.removeChild(gridContainer.firstChild);
		}
		gridRef = buildTabGrid(
			gridContainer,
			state.phrases,
			state.keyPosition,
			(updated) => {
				state.phrases = updated;
				if (activePhraseIdx >= state.phrases.length) {
					activePhraseIdx = state.phrases.length - 1;
				}
			},
			(phraseIdx, noteIdx) => {
				activePhraseIdx = phraseIdx;
				const note = state.phrases[phraseIdx].notes[noteIdx];
				holeInputRef?.setHoles([...note.holes], note.octave);
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
		navigator.clipboard
			?.writeText(url)
			.then(() => {
				const original = shareBtn.textContent;
				shareBtn.textContent = "Copied!";
				shareBtn.disabled = true;
				setTimeout(() => {
					shareBtn.textContent = original;
					shareBtn.disabled = false;
				}, 2000);
			})
			.catch(() => {});
	}

	renderInputPanel();
	renderGrid();
}
