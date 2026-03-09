const PAGES = [
	{ id: "circle", label: "Circle" },
	{ id: "tabs", label: "Tabs" },
] as const;

type PageId = (typeof PAGES)[number]["id"];

export function buildNav(
	nav: HTMLElement,
	onNavigate: (page: PageId) => void,
): (page: PageId) => void {
	const buttons = new Map<PageId, HTMLButtonElement>();

	for (const { id, label } of PAGES) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "nav-btn";
		btn.textContent = label;
		btn.dataset.page = id;
		btn.addEventListener("click", () => {
			setActive(id);
			onNavigate(id);
		});
		buttons.set(id, btn);
		nav.appendChild(btn);
	}

	function setActive(page: PageId): void {
		for (const [id, btn] of buttons) {
			btn.classList.toggle("nav-btn--active", id === page);
		}
	}

	return setActive;
}
