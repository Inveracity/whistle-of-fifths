import { buildCircle, highlightPositions } from "./circle";
import { getHighlightedPositions, WHISTLES } from "./data";
import { buildSelector } from "./selector";

document.addEventListener("DOMContentLoaded", () => {
	const svg = document.getElementById("circle") as unknown as SVGSVGElement;
	const selectorEl = document.getElementById("selector") as HTMLElement;

	buildCircle(svg);

	const defaultWhistle = WHISTLES.find((w) => w.label === "D") ?? WHISTLES[2];

	const setActive = buildSelector(selectorEl, (position) => {
		highlightPositions(getHighlightedPositions(position));
	});

	setActive(defaultWhistle.position);
	highlightPositions(getHighlightedPositions(defaultWhistle.position));
});
