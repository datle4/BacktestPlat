# Development log

## Project setup
Branch: `feature/project-setup`

- Reused the existing Java 21 / Spring Boot 4 and React / TypeScript foundation.
- Replaced obsolete project documentation and CI checks referring to missing files.
- Saved the requested workflow in `docs/workflow.md`; created the MVP status checklist.
- Validation: Maven tests, frontend lint, unit tests and production build.
- Limitations: business features follow in separate branches; no authentication in MVP.

## Database setup
Branch: `feature/database-setup`

- Added PostgreSQL Docker service with persistent storage and healthcheck, JDBC, Flyway, and environment configuration.
- Files: `compose.yaml`, `backend/pom.xml`, application and test YAML, CI PostgreSQL service.
- Tests: Spring context and actual SQL connection on H2 and Docker PostgreSQL.
- Decision: port 55432 avoids the existing local PostgreSQL container; tests can target either database.
- Limitations: local development database credentials; business migrations follow with each feature.

## Frontend foundation cleanup
Branch: `feature/frontend-foundation`

- Replaced inherited VN Stock Dashboard copy with a BacktestPlat setup screen and explicitly pending MVP scope.
- Removed stale OAuth proxy routes, demo environment flags and unused sidebar preferences. Retained React, existing palette/fonts and accessible theme controls.
- Rewrote root/frontend READMEs with actual Docker, database, backend, frontend and verification commands.
- Files: frontend setup component/styles/tests, Vite/nginx configuration, READMEs and project status.
- Validation: frontend lint, 3 unit tests, production build; Playwright responsive/theme/axe checks at four viewport widths.
- Limitation: setup UI only; no business features. Stop here per user instruction, pending model choice and an explicit request to continue.
- GitHub connector returned HTTP 403 for PR creation; setup branches are preserved and merged through Git instead.

## Fixed historical data scope
Branch: `docs/static-data-scope`

- Recorded the user's revised scope: a one-time historical dataset through 2026-09-20, with completed available trading sessions only.
- Deferred daily scheduling, automatic catch-up and real Quant integration; documented the three phase boundaries and mock-first web MVP.
- Updated README, project status and the setup screen's planned-data description. The original workflow remains as historical context, with current scope explicitly overriding the deferred requirements.
- Validation: documentation diff review, frontend production build and existing unit tests.
- No market data fetched and no business feature implemented; still awaiting the user's request to start Phase 1.

## Stock storage
Branch: `feature/stock-storage`

- Added the `stocks` Flyway migration, JDBC repository and read-only `/api/stocks` endpoints.
- Symbols are normalized to uppercase; symbol uniqueness and exchange values are enforced by the database.
- Used a sequential bigint identity key and an exact unique constraint for predictable inserts and lookups.
- Tests cover idempotent metadata upsert, normalization and stable symbol ordering.
- Limitation: stocks are created by the historical importer in the next feature; no public write endpoint is exposed.
