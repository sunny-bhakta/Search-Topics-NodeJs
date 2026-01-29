# Repository Layout Strategy for Search Features

Use this blueprint to keep multiple search-related topics in a single repository while isolating concerns and enabling future composition.

## 1. High-Level Layout

```
/
├── docs/                  # Architecture notes, decision records, playbooks
├── packages/
│   ├── core-engine/       # Query parsing, ranking, aggregation primitives
│   ├── data-pipeline/     # ETL, indexing workers, schema evolution
│   ├── ux-experience/     # Autocomplete, merchandising widgets, API adapters
│   └── api-gateway/       # REST/GraphQL layer that stitches packages together
├── apps/
│   ├── search-cli/        # Developer CLI for manual exploration
│   └── search-service/    # Production service (express/fastify) bundling packages
└── tooling/               # Shared configs (eslint, tsconfig, jest), scripts, CI
```

- Keep each package self-contained (own `package.json`, `tsconfig.json`, tests).
- Share lint/test configs via the root `tooling/` folder or workspace-level config.
- Use npm workspaces or pnpm to manage cross-package dependencies and keep hoisting predictable.

## 2. Per-Topic Folder Guidance

| Topic | Folder | Purpose | Notes |
| ----- | ------ | ------- | ----- |
| Search Algorithm & Ranking | `packages/core-engine` | Retrieval models, scoring functions, vector support | Export pure TypeScript modules for reuse in CLI/service. |
| Data/Indexing | `packages/data-pipeline` | Catalog ingestion, enrichment, index writers | Include infra-as-code snippets or docker compose for local ES/OpenSearch. |
| Experience Layer | `packages/ux-experience` | Autocomplete APIs, merchandising rule helpers | Provide contract tests that mock the engine + pipeline. |
| Edge/API | `packages/api-gateway` | HTTP/gRPC transport, auth, rate limits | Thin layer wiring packages into deployable service. |
| Reference Apps | `apps/search-cli`, `apps/search-service` | Example consumers | Keep them lightweight; they validate integration without bloating packages. |

## 3. Combining Features Later

1. **Define contracts early** – e.g., `SearchRequest`, `SearchResult`, telemetry payloads – and version them under `packages/core-engine/src/contracts`. This keeps integration predictable.
2. **Use workspace-level TypeScript project references** so each package emits types that others can import without rebuilding the world.
3. **Create integration tests** inside `apps/search-service/tests` that spin up the engine + data pipeline via dependency injection. Run these in CI after package unit tests pass.
4. **Expose a composition layer**: `packages/api-gateway/src/bootstrap.ts` should take dependency objects `{ engine, dataPipeline, experience }`, allowing you to plug mocks during tests or swap implementations.
5. **Publish artifacts** (npm, internal registry, or dist tarballs) when a topic package reaches maturity; the combined app can then depend on specific versions.

## 4. Workflow Tips

- Add a root `package.json` with `"workspaces": ["packages/*", "apps/*"]` to coordinate installs.
- Use `changesets` or a similar tool to version packages independently while keeping them in the same repo.
- Automate quality gates per package (lint, unit test) plus an end-to-end suite that targets the combined application.
- Document integration recipes in `docs/` and link them from package READMEs for discoverability.

Adopting this structure lets you ideate per-topic in isolation today while keeping a clear path to merge them into a production-ready search service tomorrow.
