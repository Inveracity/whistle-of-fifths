export interface CircleSegment {
	major: string;
	minor: string;
	position: number;
}

export interface WhistleKey {
	label: string;
	position: number;
}

export const CIRCLE: CircleSegment[] = [
	{ major: "C", minor: "Am", position: 0 },
	{ major: "G", minor: "Em", position: 1 },
	{ major: "D", minor: "Bm", position: 2 },
	{ major: "A", minor: "F#m", position: 3 },
	{ major: "E", minor: "C#m", position: 4 },
	{ major: "B", minor: "G#m", position: 5 },
	{ major: "F#", minor: "Ebm", position: 6 },
	{ major: "Db", minor: "Bbm", position: 7 },
	{ major: "Ab", minor: "Fm", position: 8 },
	{ major: "Eb", minor: "Cm", position: 9 },
	{ major: "Bb", minor: "Gm", position: 10 },
	{ major: "F", minor: "Dm", position: 11 },
];

export const WHISTLES: WhistleKey[] = [
	{ label: "C", position: 0 },
	{ label: "G", position: 1 },
	{ label: "D", position: 2 },
	{ label: "A", position: 3 },
	{ label: "E", position: 4 },
	{ label: "B", position: 5 },
	{ label: "Ab", position: 8 },
	{ label: "Eb", position: 9 },
	{ label: "Bb", position: 10 },
	{ label: "F", position: 11 },
];

export function getHighlightedPositions(position: number): number[] {
	return [(position + 11) % 12, position, (position + 1) % 12];
}
