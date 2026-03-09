import type { TabNote } from "./fingerings";
import {
	noteTextToFingering,
	resolveFingering,
	resolveNote,
} from "./fingerings";

export interface TextInputController {
	setValue(notes: TabNote[], keyPosition: number): void;
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
	onChange: (notes: TabNote[]) => void,
): TextInputController {
	let currentKeyPosition = keyPosition;

	const wrapper = document.createElement("div");
	wrapper.className = "text-input-wrapper";

	const textarea = document.createElement("textarea");
	textarea.className = "tab-textarea";
	textarea.rows = 3;
	textarea.placeholder = `Type note names, e.g: d e f# g a b c#\nUse + for high octave: d+`;
	textarea.spellcheck = false;
	textarea.setAttribute("autocorrect", "off");
	textarea.setAttribute("autocapitalize", "none");

	const tokenRow = document.createElement("div");
	tokenRow.className = "token-row";

	wrapper.appendChild(textarea);
	wrapper.appendChild(tokenRow);
	container.appendChild(wrapper);

	function parse(): void {
		const raw = textarea.value;
		const tokens = raw.trim() === "" ? [] : raw.trim().split(/\s+/);

		while (tokenRow.firstChild) {
			tokenRow.removeChild(tokenRow.firstChild);
		}

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

		onChange(validNotes);
	}

	textarea.addEventListener("input", () => {
		parse();
	});

	return {
		setValue(notes: TabNote[], kp: number): void {
			currentKeyPosition = kp;
			textarea.value = notes.map((n) => noteToToken(n, kp)).join(" ");
			parse();
		},
		setKeyPosition(pos: number): void {
			currentKeyPosition = pos;
			parse();
		},
	};
}
