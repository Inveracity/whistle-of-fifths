export const NOTE_NAMES: string[] = [
	"C",
	"C#/Db",
	"D",
	"D#/Eb",
	"E",
	"F",
	"F#/Gb",
	"G",
	"G#/Ab",
	"A",
	"A#/Bb",
	"B",
];

export interface FingeringEntry {
	semitone: number;
	octave: 0 | 1;
}

export interface TabNote {
	holes: [boolean, boolean, boolean, boolean, boolean, boolean];
	octave: 0 | 1;
}

export interface TabState {
	keyPosition: number;
	notes: TabNote[];
	inputMode: "visual" | "text";
	title: string;
}

function key(bits: number, octave: 0 | 1): number {
	return bits | (octave << 6);
}

export const FINGERING_MAP: Map<number, FingeringEntry> = new Map([
	[key(0b111111, 0), { semitone: 0, octave: 0 }],
	[key(0b111110, 0), { semitone: 2, octave: 0 }],
	[key(0b111100, 0), { semitone: 4, octave: 0 }],
	[key(0b111000, 0), { semitone: 5, octave: 0 }],
	[key(0b110000, 0), { semitone: 7, octave: 0 }],
	[key(0b100000, 0), { semitone: 9, octave: 0 }],
	[key(0b000000, 0), { semitone: 11, octave: 0 }],

	[key(0b011000, 0), { semitone: 10, octave: 0 }],
	[key(0b011111, 0), { semitone: 1, octave: 0 }],

	[key(0b111111, 1), { semitone: 0, octave: 1 }],
	[key(0b111110, 1), { semitone: 2, octave: 1 }],
	[key(0b111100, 1), { semitone: 4, octave: 1 }],
	[key(0b111000, 1), { semitone: 5, octave: 1 }],
	[key(0b110000, 1), { semitone: 7, octave: 1 }],
	[key(0b100000, 1), { semitone: 9, octave: 1 }],
	[key(0b000000, 1), { semitone: 11, octave: 1 }],

	[key(0b011000, 1), { semitone: 10, octave: 1 }],
	[key(0b011111, 1), { semitone: 1, octave: 1 }],
]);

export function holesTo6Bit(holes: boolean[]): number {
	let bits = 0;
	for (let i = 0; i < 6; i++) {
		if (holes[i]) bits |= 1 << (5 - i);
	}
	return bits;
}

export function resolveFingering(
	holes: boolean[],
	octave: 0 | 1,
): FingeringEntry | null {
	const bits = holesTo6Bit(holes);
	return FINGERING_MAP.get(key(bits, octave)) ?? null;
}

export function resolveNote(
	semitone: number,
	octave: 0 | 1,
	keyPosition: number,
): string {
	const noteIndex = (semitone + keyPosition) % 12;
	const name = NOTE_NAMES[noteIndex];
	return octave === 1 ? `${name}+` : name;
}

const NOTE_ALIASES: Record<string, number> = {
	c: 0,
	"c#": 1,
	db: 1,
	d: 2,
	"d#": 3,
	eb: 3,
	e: 4,
	f: 5,
	"f#": 6,
	gb: 6,
	g: 7,
	"g#": 8,
	ab: 8,
	a: 9,
	"a#": 10,
	bb: 10,
	b: 11,
};

export function noteTextToFingering(
	token: string,
	keyPosition: number,
): {
	holes: [boolean, boolean, boolean, boolean, boolean, boolean];
	octave: 0 | 1;
} | null {
	const raw = token.toLowerCase().trim();
	const highOctave = raw.endsWith("+");
	const notePart = highOctave ? raw.slice(0, -1) : raw;
	const octave: 0 | 1 = highOctave ? 1 : 0;

	const absoluteSemitone = NOTE_ALIASES[notePart];
	if (absoluteSemitone === undefined) return null;

	const relativeSemitone = (absoluteSemitone - keyPosition + 12) % 12;

	for (const [mapKey, entry] of FINGERING_MAP) {
		if (entry.semitone === relativeSemitone && entry.octave === octave) {
			const bits = mapKey & 0b111111;
			const holes = Array.from({ length: 6 }, (_, i) =>
				Boolean(bits & (1 << (5 - i))),
			) as [boolean, boolean, boolean, boolean, boolean, boolean];
			return { holes, octave };
		}
	}

	return null;
}
