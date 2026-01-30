# Search Catalog Workspace

Monorepo that explores production search catalogs using Node.js + TypeScript. It ships a reusable core engine, supporting packages (data pipeline, UX helpers, API gateway), and two reference apps (CLI + HTTP service), all linted/tested through a single toolchain.

## Prerequisites

- Node.js 18+
- npm 9+

## Quick Start

```bash
npm install                    # installs all workspaces
npm run dev -- "TypeScript"    # run the CLI in watch mode

# in another terminal
npm start                      # start the HTTP service on :3333
curl "http://localhost:3333/search?q=jest"
```

Build + test everything:

```bash
npm run build
npm test
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Proxies to `@search/search-cli` watch mode for local queries. |
| `npm start` | Runs the compiled `@search/search-service` HTTP server. |
| `npm run build` | Runs `tsc -b` across every workspace (packages + apps). |
| `npm test` / `npm run test:watch` | Executes Jest over `packages/**` + `apps/**`. |
| `npm run lint` / `npm run lint:fix` | ESLint over all TypeScript sources. |
| `npm run format` | Prettier format for packages + apps. |

Workspace-specific scripts live in each folder (e.g., `npm run dev --workspace @search/search-service`).

## Repository Layout

```
docs/
  README.md         # feature checklist for e-commerce search
  structure.md      # monorepo layout decisions
packages/
  core-engine/      # search algorithms + sample dataset
  data-pipeline/    # catalog events + in-memory repository
  ux-experience/    # formatting + autocomplete helpers
  api-gateway/      # controller that stitches repositories + UX helpers
apps/
  search-cli/       # developer CLI (ts-node-dev, bin alias `search-cli`)
  search-service/   # Node http server exposing /search + /search/autocomplete
```

Refer to `docs/structure.md` for the full roadmap on how these pieces evolve as more catalog features land.

## Using the Packages

- `@search/core-engine`: import `searchCatalogs` and `Catalog` to embed search anywhere.
- `@search/data-pipeline`: bootstrap or mutate the catalog repository via events.
- `@search/ux-experience`: translate raw catalog items into UI-ready cards and autocomplete suggestions.
- `@search/api-gateway`: create controllers/handlers that orchestrate everything above.

Each package is typed, testable, and emits declarations so you can compose them from any app.

## Reference Apps

- **CLI** (`npm run dev -- <query>`): prints results in the terminal and optionally shows suggestions via `--suggest`.
- **HTTP Service** (`npm start`): exposes `/search?q=` and `/search/autocomplete?q=` endpoints plus `/health`.

Both apps rely solely on the packages, so new algorithm or data changes propagate automatically.
