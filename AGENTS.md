# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Keep domain work under `src/features/<feature>/`, with feature-local `api/`, `components/`, `hooks/`, `data/`, and `lib/` folders as needed. File-based TanStack Router routes belong in `src/routes/`; authenticated pages live below `src/routes/_authenticated/`. Reusable primitives are in `src/components/ui/`, shared application components in `src/components/`, and cross-feature helpers in `src/lib/` and `src/hooks/`. Static files belong in `public/`; project guides and SQL migrations live in `docs/`. Do not edit the generated `src/routeTree.gen.ts` manually.

## Build, Test, and Development Commands

- `pnpm install`: install the locked dependencies.
- `pnpm dev`: start Vite at `http://localhost:5173`.
- `pnpm build`: run the TypeScript project build, then create the production bundle.
- `pnpm preview`: serve the production bundle locally.
- `pnpm lint`: run ESLint across the repository.
- `pnpm format:check`: verify Prettier formatting without changing files.
- `pnpm format`: format files and sort imports and Tailwind classes.
- `pnpm knip`: report unused files, exports, and dependencies.

## Coding Style & Naming Conventions

Use strict TypeScript and functional React components. Prettier enforces two-space indentation, 80-character lines, single quotes, no semicolons, and LF endings. Prefer the `@/` alias for imports from `src/`, and use type-only imports where required by ESLint. Follow the existing naming style: kebab-case filenames, PascalCase components and types, camelCase functions and variables, and `use...` names for hooks. Keep API access in a feature's `api/` layer and validation schemas near the feature data they validate.

## Testing Guidelines

Board ordering uses Node.js's built-in test runner: run `pnpm test:board` with Node.js 22.18 or newer. Colocate tests as `*.test.ts` or `*.test.tsx` beside the code. Before opening a pull request, run the relevant tests, `pnpm lint`, `pnpm format:check`, and `pnpm build`, then manually exercise the changed flow in both relevant responsive layouts and themes. Add commands for new test suites to `package.json`.

## Security & Configuration

Copy `.env.example` to `.env` for local setup. Never commit Supabase, Clerk, or Google credentials. Treat `VITE_*` values as browser-visible and do not place server secrets in them.

## Commit & Pull Request Guidelines

History follows Conventional Commit prefixes such as `feat:`, `fix:`, and `style:`. Keep commits atomic and write imperative, specific subjects. Pull requests should explain the user-visible change, note validation performed, link the relevant issue, and include screenshots or recordings for UI changes. Call out schema changes and include the matching migration under `docs/migrations/`.
