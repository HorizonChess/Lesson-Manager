# Repository Guidelines

## Project Structure & Module Organization
The app is a Vite + React TypeScript client. Core UI flows live in `src/pages/` while reusable UI sits in `src/components/`. Shared logic is organized under `src/hooks/`, `src/stores/` for Zustand state, and `src/services/` for Supabase-facing data access. Utility helpers go to `src/lib/` and `src/utils/`. Static assets live in `public/`, and docs reside in `docs/`. Node-based unit tests live in `tests/`, and Supabase migrations or configuration live in `supabase/`.

## Build, Test, and Development Commands
Run `npm install` before contributing. Use `npm run dev` for the hot-reload dev server, `npm run build` to run TypeScript project references then bundle with Vite, and `npm run preview` to smoke-test the production build. Lint the tree with `npm run lint`. For focused modules, run `node --test tests/scheduling.test.ts`, and execute Playwright suites with `npx playwright test` (config in `playwright.config.ts`).

## Coding Style & Naming Conventions
Follow the TypeScript + React patterns already in place: 2-space indentation, single quotes, and ES module imports. Name React components and Zustand stores in PascalCase, hooks prefixed with `use`, utility functions in camelCase, and TypeScript types or interfaces in PascalCase. Keep modules small and colocate feature-specific state in `src/services/` to match the current pattern. ESLint (`eslint.config.js`) is the source of truth; resolve warnings before submitting.

## Testing Guidelines
Prefer node's built-in test runner (`node --test`) for fast unit coverage and expand on the `tests/` directory with files named `*.test.ts`. Mock Supabase interactions at the service layer. For UI regression, add Playwright specs under `tests/e2e/` when scenarios cross page boundaries. Target green runs for both unit and Playwright jobs before opening a PR.

## Commit & Pull Request Guidelines
Follow Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`, etc.), mirroring the existing history (`refactor: move lessons mutations to services`). Each commit should capture a minimal logical change. Pull requests need a clear summary, screenshots or clips for UI-affecting work, linked issue IDs, and notes on test coverage (`node --test`, `npm run lint`, `npx playwright test`). Request review from a maintainer and wait for approval before merging.

## Environment & Secrets
Create a `.env` from `.env.example` and populate Supabase credentials locally; never commit secrets. Use `supabase/` for schema changes and document migrations in `docs/` so deployments stay reproducible.
