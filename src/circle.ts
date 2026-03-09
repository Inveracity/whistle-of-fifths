import { CIRCLE } from "./data";

const NS = "http://www.w3.org/2000/svg";
const TWO_PI = Math.PI * 2;
const SEGMENT_GAP = 0.02;

const OUTER_R = 200;
const OUTER_INNER_R = 140;
const INNER_R = 135;
const INNER_INNER_R = 80;
const CENTER_X = 250;
const CENTER_Y = 250;
const ROTATION_OFFSET = -Math.PI / 12;

function toRad(position: number, total: number, offset: number): number {
	return (position / total) * TWO_PI + offset - Math.PI / 2;
}

function polarToCartesian(
	cx: number,
	cy: number,
	r: number,
	angle: number,
): [number, number] {
	return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function buildArcPath(
	cx: number,
	cy: number,
	outerR: number,
	innerR: number,
	startAngle: number,
	endAngle: number,
): string {
	const [oxs, oys] = polarToCartesian(cx, cy, outerR, startAngle);
	const [oxe, oye] = polarToCartesian(cx, cy, outerR, endAngle);
	const [ixe, iye] = polarToCartesian(cx, cy, innerR, endAngle);
	const [ixs, iys] = polarToCartesian(cx, cy, innerR, startAngle);
	return `M ${oxs} ${oys} A ${outerR} ${outerR} 0 0 1 ${oxe} ${oye} L ${ixe} ${iye} A ${innerR} ${innerR} 0 0 0 ${ixs} ${iys} Z`;
}

function buildLabel(
	cx: number,
	cy: number,
	r: number,
	midAngle: number,
	text: string,
	className: string,
): SVGTextElement {
	const [x, y] = polarToCartesian(cx, cy, r, midAngle);
	const el = document.createElementNS(NS, "text");
	el.setAttribute("x", String(x));
	el.setAttribute("y", String(y));
	el.setAttribute("text-anchor", "middle");
	el.setAttribute("dominant-baseline", "central");
	el.setAttribute("class", className);
	el.textContent = text;
	return el;
}

export function buildCircle(svg: SVGSVGElement): void {
	const total = 12;

	for (let i = 0; i < total; i++) {
		const seg = CIRCLE[i];
		const startAngle = toRad(i, total, ROTATION_OFFSET) + SEGMENT_GAP;
		const endAngle = toRad(i + 1, total, ROTATION_OFFSET) - SEGMENT_GAP;
		const midAngle = (startAngle + endAngle) / 2;

		const outerPath = document.createElementNS(NS, "path");
		outerPath.setAttribute(
			"d",
			buildArcPath(
				CENTER_X,
				CENTER_Y,
				OUTER_R,
				OUTER_INNER_R,
				startAngle,
				endAngle,
			),
		);
		outerPath.setAttribute("class", "segment segment--major");
		outerPath.dataset.position = String(seg.position);
		outerPath.dataset.ring = "major";

		const innerPath = document.createElementNS(NS, "path");
		innerPath.setAttribute(
			"d",
			buildArcPath(
				CENTER_X,
				CENTER_Y,
				INNER_R,
				INNER_INNER_R,
				startAngle,
				endAngle,
			),
		);
		innerPath.setAttribute("class", "segment segment--minor");
		innerPath.dataset.position = String(seg.position);
		innerPath.dataset.ring = "minor";

		const outerLabel = buildLabel(
			CENTER_X,
			CENTER_Y,
			(OUTER_R + OUTER_INNER_R) / 2,
			midAngle,
			seg.major,
			"segment-label segment-label--major",
		);
		outerLabel.dataset.position = String(seg.position);

		const innerLabel = buildLabel(
			CENTER_X,
			CENTER_Y,
			(INNER_R + INNER_INNER_R) / 2,
			midAngle,
			seg.minor,
			"segment-label segment-label--minor",
		);
		innerLabel.dataset.position = String(seg.position);

		svg.appendChild(outerPath);
		svg.appendChild(innerPath);
		svg.appendChild(outerLabel);
		svg.appendChild(innerLabel);
	}
}

export function highlightPositions(positions: number[]): void {
	const set = new Set(positions);
	document.querySelectorAll<SVGPathElement>(".segment").forEach((el) => {
		const pos = Number(el.dataset.position);
		el.classList.toggle("segment--highlighted", set.has(pos));
	});
	document.querySelectorAll<SVGTextElement>(".segment-label").forEach((el) => {
		const pos = Number(el.dataset.position);
		el.classList.toggle("segment-label--highlighted", set.has(pos));
	});
}
