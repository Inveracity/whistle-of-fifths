# Whistle of Fifths — Copilot Instructions

## Stack

- **Runtime / bundler**: Bun
- **Language**: TypeScript (strict, ESNext)
- **Frontend**: Vanilla TypeScript, no frameworks
- **Styles**: Vanilla CSS with custom properties
- **Server**: `Bun.serve` static file server (`server.ts`)

## Commands

- `bun run dev` — start dev server at http://localhost:3000 (serves `dist/`)
- `bun run build` — bundle `src/main.ts` to `dist/`, copy `index.html` and `style.css`
- `bun run biome check` — run Biome linter

## Project Rules

- No emojis
- No comments
- No JSDoc / TSDoc

## File Structure

```
src/
  index.html    — app shell
  style.css     — all styles via CSS custom properties
  main.ts       — entry point, wires components
  data.ts       — circle positions, whistle key mappings, highlight logic
  circle.ts     — SVG circle of fifths renderer
  selector.ts   — whistle key selector UI
server.ts       — Bun static file server
```

## Conventions

- All SVG elements built with `document.createElementNS` (no innerHTML)
- CSS theming via `--custom-properties` on `:root`, with `@media (prefers-color-scheme: dark)` overrides
- Highlight logic: whistle at circle position P highlights `[(P+11)%12, P, (P+1)%12]`
