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

## Historical price storage
Branch: `feature/historical-price-storage`

- Added daily OHLCV storage using exact numeric prices and a bigint volume.
- Enforced one row per stock and trading session with `(stock_id, trading_date)`, plus price-range and non-negative checks.
- The composite unique index supports the main access pattern: one stock over a date range.
- Repository import is idempotent and tests cover replacement of an existing session and chronological range reads.
- Limitation: the import feature is single-process; database constraints remain the final integrity guard.

## Historical price API
Branch: `feature/historical-price-api`

- Added `GET /api/stocks/{symbol}/prices?from=YYYY-MM-DD&to=YYYY-MM-DD` with an inclusive date range.
- Responses include the fixed data cutoff and chronological OHLCV points for the frontend.
- Added RFC 9457-style problem responses for unknown symbols, invalid dates and requests beyond the cutoff.
- Tests cover a successful series, reversed ranges and dates after 2026-09-20.
- Limitation: the endpoint returns an empty series when a known stock has no observations in the range.

## One-time historical data import
Branch: `feature/historical-data-import`

- Added a Java-only importer using `am.ik.yfinance4j:yfinance4j:0.1.1`; Python is not part of the repository, runtime or Docker setup.
- Imports FPT, HPG, TCB, VIC and VNM from 2021-01-01 through the fixed 2026-09-20 cutoff, then exits. Existing `(stock_id, trading_date)` rows are updated, so reruns are idempotent.
- Validates the requested date range and OHLCV integrity. Five inconsistent Yahoo rows on 2021-11-02 were logged and skipped instead of being altered.
- Verified against PostgreSQL Docker: 7,432 stored rows, latest session 2026-09-18, zero rows after the cutoff and about 1.1 MB of table/index storage.
- Tests cover the five configured symbols, cutoff enforcement, valid persistence and rejection of inconsistent provider data.
- Limitation: Yahoo Finance is an external unofficial source; import requires network access and the provider may change or rate-limit requests.

## Historical market data frontend
Branch: `feature/historical-data-frontend`

- Replaced the setup placeholder and remaining old-project copy with a live market-data screen backed by `/api/stocks` and `/api/stocks/{symbol}/prices`.
- Added stock/date filters, latest close and period metrics, an accessible SVG closing-price chart, and a responsive table for the 12 latest OHLCV sessions.
- Implemented loading, error, empty-data and invalid-range states while retaining the light/dark/system theme preference.
- Verified with the actual PostgreSQL snapshot, plus frontend lint, three Vitest checks, production build and Playwright at 375, 768, 1024 and 1440px in both themes with automated accessibility checks.
- Phase 1 is complete. Development stops before backtesting and mock Quant until the user explicitly starts Phase 2.

## Three-page market workspace
Branch: `feature/multipage-market-ui`

- Applied the user-requested UI/UX Pro Max workflow and replaced Fira with self-hosted Inter Variable, including Vietnamese glyphs. Design decisions are recorded in `design-system/backtestplat/MASTER.md`.
- Added separate market, stock-directory and backtest-draft routes with responsive navigation, persistent themes, stock search/sort, shareable stock details and a responsive price chart.
- Market statistics aggregate matching latest dates only and explicitly describe the tracked subset. The activity list shows five leaders. No news, index values or returns are fabricated.
- Backtest saves draft settings locally; execution, results and Quant remain outside this change and await Phase 2.
- Validation: frontend lint, six Vitest checks, production build and eight Playwright checks at 375/768/1024/1440px. Browser checks cover all routes in both themes, accessibility, horizontal overflow, reduced motion, draft restoration, deep links and data-error recovery. Visually reviewed desktop/mobile captures and corrected low contrast and table overflow.

## Expanded historical stock universe
Branch: `feature/expanded-stock-universe`

- Added ACB, GAS, MBB, MSN, MWG, PLX, PNJ, SSI, VCB and VHM to the existing five stocks. The Java importer remains the only ingestion path; no scheduler or startup refresh was added.
- Kept the historical start at 2021-01-01 and fixed cutoff at 2026-09-20. Existing APIs and the dynamic directory expose all 15 symbols without hardcoded frontend metadata.
- Validation: Maven verify, 11 passing tests including the complete 15-symbol catalog, provider suffix/range validation, duplicate-free catalog and idempotent reruns. Ran the actual importer against PostgreSQL Docker and inspected the three-page UI with real data.
- Result: 22,296 price rows, all 15 symbols populated through 2026-09-18, zero rows beyond cutoff, 3,384 kB for the price table and indexes. The import logged and skipped 15 inconsistent provider rows; no replacements were invented.
- Limitation: Yahoo coverage and adjusted historical prices depend on the source. This is a tracked subset, not complete exchange coverage.
