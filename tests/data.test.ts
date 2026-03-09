import { describe, expect, it } from "vitest";
import { CIRCLE, getHighlightedPositions, WHISTLES } from "../src/data";

describe("CIRCLE", () => {
	it("has 12 segments", () => {
		expect(CIRCLE).toHaveLength(12);
	});

	it("has consecutive positions 0-11", () => {
		const positions = CIRCLE.map((s) => s.position);
		expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
	});

	it("each segment has non-empty major and minor labels", () => {
		for (const seg of CIRCLE) {
			expect(seg.major.length).toBeGreaterThan(0);
			expect(seg.minor.length).toBeGreaterThan(0);
		}
	});

	it("has unique major keys", () => {
		const majors = CIRCLE.map((s) => s.major);
		expect(new Set(majors).size).toBe(12);
	});
});

describe("WHISTLES", () => {
	it("has at least one whistle", () => {
		expect(WHISTLES.length).toBeGreaterThan(0);
	});

	it("all positions are between 0 and 11", () => {
		for (const w of WHISTLES) {
			expect(w.position).toBeGreaterThanOrEqual(0);
			expect(w.position).toBeLessThanOrEqual(11);
		}
	});

	it("has unique positions", () => {
		const positions = WHISTLES.map((w) => w.position);
		expect(new Set(positions).size).toBe(positions.length);
	});

	it("each whistle has a non-empty label", () => {
		for (const w of WHISTLES) {
			expect(w.label.length).toBeGreaterThan(0);
		}
	});
});

describe("getHighlightedPositions", () => {
	it("returns exactly 3 positions", () => {
		expect(getHighlightedPositions(0)).toHaveLength(3);
	});

	it("returns the given position and its neighbours", () => {
		expect(getHighlightedPositions(5)).toEqual([4, 5, 6]);
	});

	it("wraps below zero at position 0", () => {
		expect(getHighlightedPositions(0)).toEqual([11, 0, 1]);
	});

	it("wraps above 11 at position 11", () => {
		expect(getHighlightedPositions(11)).toEqual([10, 11, 0]);
	});

	it("all returned positions are in range 0-11", () => {
		for (let p = 0; p < 12; p++) {
			for (const pos of getHighlightedPositions(p)) {
				expect(pos).toBeGreaterThanOrEqual(0);
				expect(pos).toBeLessThanOrEqual(11);
			}
		}
	});
});
