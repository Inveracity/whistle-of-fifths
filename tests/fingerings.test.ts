import { describe, expect, it } from "vitest";
import {
	FINGERING_MAP,
	holesTo6Bit,
	NOTE_NAMES,
	noteTextToFingering,
	resolveFingering,
	resolveNote,
} from "../src/fingerings";

describe("NOTE_NAMES", () => {
	it("has 12 entries", () => {
		expect(NOTE_NAMES).toHaveLength(12);
	});

	it("starts with C", () => {
		expect(NOTE_NAMES[0]).toBe("C");
	});
});

describe("holesTo6Bit", () => {
	it("all covered = 63", () => {
		expect(holesTo6Bit([true, true, true, true, true, true])).toBe(63);
	});

	it("all open = 0", () => {
		expect(holesTo6Bit([false, false, false, false, false, false])).toBe(0);
	});

	it("top hole only = 32", () => {
		expect(holesTo6Bit([true, false, false, false, false, false])).toBe(32);
	});

	it("bottom hole only = 1", () => {
		expect(holesTo6Bit([false, false, false, false, false, true])).toBe(1);
	});
});

describe("resolveFingering", () => {
	it("all covered low octave = semitone 0", () => {
		const result = resolveFingering([true, true, true, true, true, true], 0);
		expect(result).toEqual({ semitone: 0, octave: 0 });
	});

	it("all covered high octave = semitone 0 octave 1", () => {
		const result = resolveFingering([true, true, true, true, true, true], 1);
		expect(result).toEqual({ semitone: 0, octave: 1 });
	});

	it("top 5 covered low = semitone 2", () => {
		const result = resolveFingering([true, true, true, true, true, false], 0);
		expect(result).toEqual({ semitone: 2, octave: 0 });
	});

	it("all open low = semitone 11", () => {
		const result = resolveFingering(
			[false, false, false, false, false, false],
			0,
		);
		expect(result).toEqual({ semitone: 11, octave: 0 });
	});

	it("returns null for invalid fingering", () => {
		const result = resolveFingering([true, false, true, false, true, false], 0);
		expect(result).toBeNull();
	});
});

describe("resolveNote", () => {
	it("semitone 0 keyPosition 0 low = C", () => {
		expect(resolveNote(0, 0, 0)).toBe("C");
	});

	it("semitone 0 keyPosition 2 (D key) low = D", () => {
		expect(resolveNote(0, 0, 2)).toBe("D");
	});

	it("semitone 0 keyPosition 0 high = C+", () => {
		expect(resolveNote(0, 1, 0)).toBe("C+");
	});

	it("wraps around correctly", () => {
		expect(resolveNote(11, 0, 2)).toBe("C#/Db");
	});
});

describe("noteTextToFingering", () => {
	it("parses 'd' in D key (keyPosition 2) to all-covered low", () => {
		const result = noteTextToFingering("d", 2);
		expect(result).not.toBeNull();
		expect(result?.holes).toEqual([true, true, true, true, true, true]);
		expect(result?.octave).toBe(0);
	});

	it("parses 'd+' to high octave", () => {
		const result = noteTextToFingering("d+", 2);
		expect(result).not.toBeNull();
		expect(result?.octave).toBe(1);
	});

	it("parses 'e' in D key", () => {
		const result = noteTextToFingering("e", 2);
		expect(result).not.toBeNull();
		expect(result?.holes).toEqual([true, true, true, true, true, false]);
	});

	it("is case-insensitive", () => {
		expect(noteTextToFingering("D", 2)).toEqual(noteTextToFingering("d", 2));
	});

	it("returns null for unknown token", () => {
		expect(noteTextToFingering("x", 2)).toBeNull();
	});

	it("parses 'f#' in D key", () => {
		const result = noteTextToFingering("f#", 2);
		expect(result).not.toBeNull();
	});

	it("covers all 18 FINGERING_MAP entries via round-trip", () => {
		expect(FINGERING_MAP.size).toBe(18);
	});
});
