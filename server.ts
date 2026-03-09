import { join } from "node:path";

const DIST = join(import.meta.dir, "dist");

const MIME: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".ico": "image/x-icon",
	".svg": "image/svg+xml",
	".png": "image/png",
	".woff2": "font/woff2",
};

function getMime(path: string): string {
	const ext = path.slice(path.lastIndexOf("."));
	return MIME[ext] ?? "application/octet-stream";
}

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
		const filePath = join(DIST, pathname);

		const file = Bun.file(filePath);
		if (!(await file.exists())) {
			return new Response("Not Found", { status: 404 });
		}

		return new Response(file, {
			headers: { "Content-Type": getMime(filePath) },
		});
	},
});

console.log("Dev server running at http://localhost:3000");
