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

## Sci-fi gradient themes
Branch: `feature/scifi-gradient-themes`

- Updated both themes at the user's request: midnight navy/cyan/lavender for dark mode and ice-blue/lavender for light mode.
- Added shared theme-specific linear gradients across surfaces, navigation selection, primary actions and charts, with a fine background grid and restrained static glow in dark mode. Kept gain/loss colors distinct and typography solid for readability.
- Updated `frontend/src/styles/index.css`, SVG gradients in `PriceChart.tsx`, browser theme colors and the design-system record. Layout, data and routes are unchanged.
- Validation: lint, production build and eight Playwright checks across all three pages, both themes and 375/768/1024/1440px. All automated accessibility, overflow and reduced-motion checks pass. Visually reviewed both desktop themes and mobile dark backtest.

## Candlestick history and theme controls
Branch: `feature/candlestick-history-controls`

- Replaced the native theme select with a compact bordered Light/Dark dropdown positioned below the trigger, with arrow/Home/End navigation, Escape focus restoration and outside dismissal. Stored System preferences now resolve to Light.
- Removed the decorative grid from dark mode while retaining every existing gradient color; updated the homepage subtitle to “Tổng quan thị trường”.
- Added daily, Monday-based weekly, monthly and yearly OHLCV aggregation in `frontend/src/utils/candles.ts`. Partial buckets retain their actual covered dates; missing sessions are not invented.
- Historical details use a lazy-loaded TradingView Lightweight Charts renderer with a right-hand price scale, a separate volume pane, crosshair OHLCV, mouse/touch pan and zoom, reset/navigation controls and accessible per-candle inspection. Theme changes update the chart in place. The homepage price line remains unchanged.
- Design references: the official Binance TradingView guide and TradingView chart examples; links are recorded in the design system. Library license and attribution are included in the frontend.
- Validation: frontend lint, 11 Vitest checks, production build and 20 Playwright checks at 375/768/1024/1440px, covering themes, menu placement, legacy preferences, aggregation, frame changes, zoom, pan, keyboard inspection, accessibility, overflow and existing routes. Inspected FPT daily/weekly data using the already-running local backend and reviewed light/dark browser captures.
- Limitations: fixed historical snapshot, no streaming quotes or additional ingestion. The selected date range limits aggregation; 1Y may contain one candle until the user expands the start date. No backtest engine or Quant work was started.

## Phase 2 documentation
Branch: `feature/phase-two-documentation`

- Translated the root README into English while preserving local Docker/import/test instructions.
- Recorded Phase 2 authorization and the incremental, private Vietnamese implementation-guide workflow. Added explicit Git exclusions for the PDF, its editable sources and render intermediates.
- Validation: reviewed setup commands against current configuration and checked the Git exclusions. No application behavior changed.

## Mock Quant contract

Branch: `feature/mock-quant-provider`

- Added `QuantSignalProvider`, immutable chronological `SignalContext`, and `mock-cycle-v1`: BUY on session 1, SELL on session 6, repeat every 10 available sessions.
- Signals contain no execution, sizing or accounting logic. Real Quant remains Phase 3.
- Validation: backend test suite, including deterministic cycles and immutable/ordered history tests.
- Added a private PDF walkthrough after completion; its sources and output are ignored.

## Backtest execution and accounting

Branch: `feature/backtest-engine`

- Added chronological next-stored-open execution, long-only whole-share portfolio and decimal fee accounting. Cash never goes negative; affordability includes rounded fees.
- Added daily equity/drawdown, total return, realized/unrealized P&L, completed round trips and nullable win rate. Open positions are marked at the last close.
- Unfilled signals are explicit events (zero volume, insufficient cash, duplicate position, no position or no next session).
- Validation: 19 backend tests, including a hand-calculated fee/drawdown example, history-prefix checks and rounding boundaries.
- Limitations: lot size 1; no slippage, taxes, T+ settlement, partial fills or separate corporate-action processing.
- Private PDF extended with the implementation and arithmetic walkthrough.

## Saved backtest API

Branch: `feature/backtest-result-api`

- Added validated POST `/api/backtests` and GET `/api/backtests/{id}`, with UUID, input metadata and immutable versioned JSON snapshots in Flyway V3.
- Explicit 400/404/422/503 errors; successful POST is transactional and returns 201 + Location.
- Validation: 22 H2 backend tests, including full POST/GET snapshot equality after changing source prices and invalid-request cases.
- README now documents the API contract; private PDF explains controller/service/repository flow.
- No authentication, run listing, retention policy or real Quant adapter is added.

## Backtest report interface

Branch: `feature/backtest-results-ui`

- Connected run form to POST/GET, retained local drafts, added pending/error states and immutable result deep links.
- Added metrics, keyboard/pointer equity inspection, end-of-run positions and paginated filled/skipped order history using existing theme tokens.
- Validation: lint, 11 Vitest tests, production build, and 32 Playwright checks across four viewports, both themes and axe. The backend API also passed all 22 tests against Docker PostgreSQL.
- A theme-transition timing issue in the accessibility test was resolved by awaiting active animations before measuring contrast.
- Private PDF extended with React Query flow, components and chart/table interactions.
