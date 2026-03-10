import type { Phrase, TabNote } from "./fingerings";
import {
	noteTextToFingering,
	resolveFingering,
	resolveNote,
} from "./fingerings";

export interface TextInputController {
	setValue(phrases: Phrase[], keyPosition: number): void;
	setKeyPosition(pos: number): void;
}

function noteToToken(note: TabNote, keyPosition: number): string {
	const entry = resolveFingering(note.holes, note.octave);
	if (!entry) return "?";
	const full = resolveNote(entry.semitone, entry.octave, keyPosition);
	const withoutOctave = full.endsWith("+") ? full.slice(0, -1) : full;
	const plain = withoutOctave.split("/")[0].toLowerCase();
	return note.octave === 1 ? `${plain}+` : plain;
}

export function buildTextInput(
	container: HTMLElement,
	keyPosition: number,
	onChange: (phrases: Phrase[]) => void,
): TextInputController {
	let currentKeyPosition = keyPosition;
	let currentPhrases: Phrase[] = [{ columns: 8, notes: [] }];

	const wrapper = document.createElement("div");
	wrapper.className = "text-input-wrapper";

	const textarea = document.createElement("textarea");
	textarea.className = "tab-textarea";
	textarea.rows = 4;
	textarea.placeholder =
		"Type note names, e.g: d e f# g a b c#\nUse + for high octave: d+\nSeparate phrases with a new line";
	textarea.spellcheck = false;
	textarea.setAttribute("autocorrect", "off");
	textarea.setAttribute("autocapitalize", "none");

	const tokenContainer = document.createElement("div");
	tokenContainer.className = "token-container";

	wrapper.appendChild(textarea);
	wrapper.appendChild(tokenContainer);
	container.appendChild(wrapper);

	function parse(): void {
		const lines = textarea.value.split("\n");

		while (tokenContainer.firstChild) {
			tokenContainer.removeChild(tokenContainer.firstChild);
		}

		const newPhrases: Phrase[] = [];

		for (let li = 0; li < lines.length; li++) {
			const line = lines[li];
			const columns = currentPhrases[li]?.columns ?? 8;
			const tokens = line.trim() === "" ? [] : line.trim().split(/\s+/);

			const tokenRow = document.createElement("div");
			tokenRow.className = "token-row";

			const validNotes: TabNote[] = [];

			for (const token of tokens) {
				const result = noteTextToFingering(token, currentKeyPosition);
				const span = document.createElement("span");
				span.className = result ? "token" : "token token--invalid";
				span.textContent = token;
				tokenRow.appendChild(span);
				if (result) {
					validNotes.push({ holes: result.holes, octave: result.octave });
				}
			}

			tokenContainer.appendChild(tokenRow);

			if (li < lines.length - 1) {
				const sep = document.createElement("div");
				sep.className = "token-phrase-sep";
				tokenContainer.appendChild(sep);
			}

			newPhrases.push({ columns, notes: validNotes });
		}

		currentPhrases = newPhrases;
		onChange(newPhrases);
	}

	textarea.addEventListener("input", () => {
		parse();
	});

	return {
		setValue(phrases: Phrase[], kp: number): void {
			currentKeyPosition = kp;
			currentPhrases = phrases.map((p) => ({ ...p, notes: [...p.notes] }));
			textarea.value = phrases
				.map((p) => p.notes.map((n) => noteToToken(n, kp)).join(" "))
				.join("\n");
			parse();
		},
		setKeyPosition(pos: number): void {
			currentKeyPosition = pos;
			parse();
		},
	};
}
