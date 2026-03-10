import { describe, expect, it } from "vitest";
import { decodeTabState } from "../src/tabs-page";

function encode(value: unknown): string {
	return btoa(JSON.stringify(value));
}

describe("decodeTabState", () => {
	it("decodes a valid minimal state", () => {
		const state = encode({
			keyPosition: 2,
			notes: [],
			inputMode: "visual",
			title: "",
		});
		const result = decodeTabState(state);
		expect(result).not.toBeNull();
		expect(result?.keyPosition).toBe(2);
		expect(result?.phrases).toHaveLength(1);
		expect(result?.phrases[0].notes).toEqual([]);
		expect(result?.phrases[0].columns).toBe(8);
		expect(result?.inputMode).toBe("visual");
		expect(result?.title).toBe("");
	});

	it("round-trips notes correctly", () => {
		const note = {
			holes: [true, true, true, true, true, false],
			octave: 0,
		};
		const state = encode({
			keyPosition: 1,
			notes: [note],
			inputMode: "text",
			title: "My tune",
		});
		const result = decodeTabState(state);
		expect(result?.phrases).toHaveLength(1);
		expect(result?.phrases[0].notes).toHaveLength(1);
		expect(result?.phrases[0].notes[0].holes).toEqual([
			true,
			true,
			true,
			true,
			true,
			false,
		]);
		expect(result?.phrases[0].notes[0].octave).toBe(0);
		expect(result?.title).toBe("My tune");
		expect(result?.inputMode).toBe("text");
	});

	it("restores title from encoded state", () => {
		const state = encode({
			keyPosition: 0,
			notes: [],
			inputMode: "visual",
			title: "The Silver Spear",
		});
		expect(decodeTabState(state)?.title).toBe("The Silver Spear");
	});

	it("defaults title to empty string when missing", () => {
		const state = encode({ keyPosition: 0, notes: [], inputMode: "visual" });
		expect(decodeTabState(state)?.title).toBe("");
	});

	it("defaults title to empty string when non-string", () => {
		const state = encode({
			keyPosition: 0,
			notes: [],
			inputMode: "visual",
			title: 42,
		});
		expect(decodeTabState(state)?.title).toBe("");
	});

	it("defaults inputMode to visual for unknown value", () => {
		const state = encode({
			keyPosition: 0,
			notes: [],
			inputMode: "banana",
			title: "",
		});
		expect(decodeTabState(state)?.inputMode).toBe("visual");
	});

	it("returns null for invalid base64", () => {
		expect(decodeTabState("!!!not-base64!!!")).toBeNull();
	});

	it("returns null for non-object JSON", () => {
		expect(decodeTabState(btoa("42"))).toBeNull();
		expect(decodeTabState(btoa('"hello"'))).toBeNull();
		expect(decodeTabState(btoa("null"))).toBeNull();
	});

	it("returns null when keyPosition is missing", () => {
		const state = encode({ notes: [], inputMode: "visual", title: "" });
		expect(decodeTabState(state)).toBeNull();
	});

	it("returns null when keyPosition is out of range", () => {
		expect(
			decodeTabState(
				encode({ keyPosition: -1, notes: [], inputMode: "visual", title: "" }),
			),
		).toBeNull();
		expect(
			decodeTabState(
				encode({ keyPosition: 12, notes: [], inputMode: "visual", title: "" }),
			),
		).toBeNull();
	});

	it("returns null when keyPosition is not an integer", () => {
		const state = encode({
			keyPosition: 1.5,
			notes: [],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("returns null when notes is not an array", () => {
		const state = encode({
			keyPosition: 0,
			notes: "bad",
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("returns null when a note has wrong holes length", () => {
		const state = encode({
			keyPosition: 0,
			notes: [{ holes: [true, true], octave: 0 }],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("returns null when a note has non-boolean holes", () => {
		const state = encode({
			keyPosition: 0,
			notes: [{ holes: [1, 1, 1, 1, 1, 1], octave: 0 }],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("returns null when a note has invalid octave", () => {
		const state = encode({
			keyPosition: 0,
			notes: [{ holes: [true, true, true, true, true, true], octave: 2 }],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("accepts octave 1 on a note", () => {
		const state = encode({
			keyPosition: 0,
			notes: [{ holes: [true, true, true, true, true, true], octave: 1 }],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)?.phrases[0].notes[0].octave).toBe(1);
	});

	it("decodes new phrases format", () => {
		const state = encode({
			keyPosition: 2,
			phrases: [
				{
					columns: 6,
					notes: [{ holes: [true, true, true, true, true, true], octave: 0 }],
				},
				{ columns: 8, notes: [] },
			],
			inputMode: "visual",
			title: "",
		});
		const result = decodeTabState(state);
		expect(result).not.toBeNull();
		expect(result?.phrases).toHaveLength(2);
		expect(result?.phrases[0].columns).toBe(6);
		expect(result?.phrases[0].notes).toHaveLength(1);
		expect(result?.phrases[1].columns).toBe(8);
		expect(result?.phrases[1].notes).toHaveLength(0);
	});

	it("returns null when phrases contains invalid phrase", () => {
		const state = encode({
			keyPosition: 0,
			phrases: [{ columns: 0, notes: [] }],
			inputMode: "visual",
			title: "",
		});
		expect(decodeTabState(state)).toBeNull();
	});

	it("wraps legacy notes to a single phrase with columns 8", () => {
		const state = encode({
			keyPosition: 0,
			notes: [{ holes: [true, true, true, true, true, false], octave: 0 }],
			inputMode: "visual",
			title: "",
		});
		const result = decodeTabState(state);
		expect(result?.phrases).toHaveLength(1);
		expect(result?.phrases[0].columns).toBe(8);
		expect(result?.phrases[0].notes).toHaveLength(1);
	});
});
