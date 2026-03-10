import { buildCircle, highlightPositions } from "./circle";
import { getHighlightedPositions, WHISTLES } from "./data";
import { buildNav } from "./nav";
import { buildSelector } from "./selector";
import { buildTabsPage, decodeTabState } from "./tabs-page";

type PageId = "circle" | "tabs";

function getInitialPage(): PageId {
	const hash = window.location.hash.replace(/^#/, "").split("?")[0];
	return hash === "tabs" ? "tabs" : "circle";
}

function showPage(page: PageId): void {
	const circle = document.getElementById("page-circle") as HTMLElement;
	const tabs = document.getElementById("page-tabs") as HTMLElement;
	circle.classList.toggle("page--hidden", page !== "circle");
	tabs.classList.toggle("page--hidden", page !== "tabs");
	if (page === "circle") {
		window.location.hash = "circle";
	} else {
		if (!window.location.hash.startsWith("#tabs")) {
			window.location.hash = "tabs";
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const svg = document.getElementById("circle") as unknown as SVGSVGElement;
	const selectorEl = document.getElementById("selector") as HTMLElement;
	const navEl = document.getElementById("nav") as HTMLElement;
	const themeToggle = document.getElementById(
		"theme-toggle",
	) as HTMLButtonElement;

	function resolvedTheme(): "light" | "dark" {
		const saved = document.documentElement.dataset.theme as
			| "light"
			| "dark"
			| undefined;
		if (saved === "light" || saved === "dark") return saved;
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	function applyTheme(theme: "light" | "dark"): void {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("theme", theme);
		themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
	}

	applyTheme(resolvedTheme());

	themeToggle.addEventListener("click", () => {
		applyTheme(resolvedTheme() === "dark" ? "light" : "dark");
	});

	buildCircle(svg);

	const defaultWhistle = WHISTLES.find((w) => w.label === "D") ?? WHISTLES[2];

	const setActiveSelector = buildSelector(selectorEl, (position) => {
		highlightPositions(getHighlightedPositions(position));
	});

	setActiveSelector(defaultWhistle.position);
	highlightPositions(getHighlightedPositions(defaultWhistle.position));

	const initialPage = getInitialPage();
	const tabsEl = document.getElementById("page-tabs") as HTMLElement;
	const hashData = window.location.hash.match(/[?&]data=([^&]+)/);
	const initialState = hashData ? decodeTabState(hashData[1]) : null;
	buildTabsPage(tabsEl, initialState);

	const setActiveNav = buildNav(navEl, (page) => {
		showPage(page);
	});

	setActiveNav(initialPage);
	showPage(initialPage);

	window.addEventListener("hashchange", () => {
		const page = getInitialPage();
		setActiveNav(page);
		const circle = document.getElementById("page-circle") as HTMLElement;
		const tabs = document.getElementById("page-tabs") as HTMLElement;
		circle.classList.toggle("page--hidden", page !== "circle");
		tabs.classList.toggle("page--hidden", page !== "tabs");
	});
});
