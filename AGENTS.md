# Repository Guidelines

## Structure

Source files live in `src/`: `card.js` renders the card and invokes Home Assistant services; `editor.js`
owns visual configuration; `model.js` performs registry-based entity discovery and aggregation;
`localize.js` stores UI strings; and `styles.js` contains Lit CSS. Tests are under `test/`. The release
bundle is generated at `dist/freebox-pop-card.js` and must not be edited manually.

## Commands

Use Node.js 20.19 or newer. `npm ci` installs dependencies, `npm test` runs Vitest, `npm run lint` runs
ESLint, `npm run format:check` checks Prettier, `npm run build` creates the HACS bundle, and
`npm run check` runs every release gate.

## Conventions

Use ES modules, two-space indentation, semicolons, and double quotes. Discover entities through Home
Assistant registry metadata, stable integration unique IDs, and `device_id`, never through a user's
editable entity ID. Keep Freebox authentication and API calls out of the browser. Omit unsupported
capabilities and confirm disruptive actions. Preserve keyboard accessibility and Home Assistant themes.

## Releases

Use calendar versions such as `2026.9.0`; update `package.json` and `CHANGELOG.md` together. Do not commit
tokens, IP addresses from real installations, serial numbers, MAC addresses, cookies, or unredacted
diagnostics.
