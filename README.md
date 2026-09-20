# BacktestPlat

A stock strategy backtesting workspace built around historical OHLCV data and replaceable Quant signals.

**Status: Phase 1 is complete; Phase 2 is in progress.** The market overview, stock directory, historical charts and backtest draft screen are available. Phase 2 adds a deterministic mock Quant provider, simulation engine, execution and portfolio accounting, saved results, performance charts and trade history. Real Quant integration belongs to Phase 3.

## Technology

- Backend: Java 21+, Spring Boot 4.1.1, Maven Wrapper, Spring MVC, JDBC and Flyway.
- Frontend: React 19, TypeScript, Vite, React Query, React Router and Zustand.
- Charts: TradingView Lightweight Charts, loaded on demand.
- Database: PostgreSQL 17.10 in Docker; H2 for fast tests.
- Validation: JUnit, Vitest, Playwright, axe and GitHub Actions.

## Repository layout

```text
backend/       Spring Boot APIs, market data, Java importer and backtesting
frontend/      Market overview, stocks and backtest workspace
compose.yaml   Local PostgreSQL service and persistent data volume
.env.example   Example local configuration
docs/          Project status, development log and Git workflow
```

## Local setup

Requirements: Java 21 or newer, Node.js 24, npm 11, Docker Engine/Desktop and Docker Compose v2. Start the following commands at the repository root unless stated otherwise.

### 1. Start PostgreSQL in Docker

```sh
cp .env.example .env
docker compose up -d --wait db
docker compose ps
```

Connect on `localhost:55432`, database/user `backtestplat`, using the local password in `.env`. Port `55432` avoids conflicts with an existing PostgreSQL instance on `5432`. The `postgres-data` volume survives container restarts.

```sh
docker compose logs db
docker compose exec db psql -U backtestplat -d backtestplat
# Stop containers while keeping the database volume:
docker compose down
```

### 2. Start the backend

```sh
set -a
. ./.env
set +a
cd backend
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080`. If you run `BackendApplication` from IntelliJ, stop any other backend instance first. Only one process can listen on port 8080.

API endpoints:

- `POST /api/backtests` - run and persist a simulation (201 + Location).
- `GET /api/backtests/{id}` - retrieve the immutable saved result.
- `GET /api/stocks`
- `GET /api/stocks/{symbol}`
- `GET /api/stocks/{symbol}/prices?from=2021-01-01&to=2026-09-20`

### 3. Import historical data once

The Java importer uses `yfinance4j` and Yahoo Finance to load 15 HOSE stocks (provider symbols end in `.VN`) into Docker PostgreSQL. With the database running, export the environment as above, then run from `backend/`:

```sh
MARKET_DATA_IMPORT_ENABLED=true ./mvnw --batch-mode --no-transfer-progress spring-boot:run
```

The process exits when finished. The default range is `2021-01-01` through the fixed inclusive cutoff `2026-09-20`. The cutoff does not advance with the date of execution. Rows are upserted by stock and trading date, so reruns are idempotent. Incomplete or inconsistent OHLCV rows are logged and skipped; no replacement data is invented.

### 4. Start the frontend

In another terminal, at the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

- `/`: tracked-market overview, breadth, volume, price chart and the five most active stocks.
- `/stocks`: search and sort stocks, inspect candlestick history and the latest 12 daily OHLCV rows. Deep links such as `/stocks?symbol=FPT` are supported.
- `/backtest`: configure a mock simulation, run it and inspect metrics, equity, positions and filled/skipped orders. Save a local draft independently. Results can be reopened with `/backtest?run=<id>`.

The Vietnamese UI uses self-hosted Inter, responsive layouts and persistent Light/Dark preferences. The compact theme menu opens below its button. Both themes retain blue/violet gradients; dark mode has no decorative background grid.

Historical charts support 1D, 1W, 1M and 1Y candles, a volume pane, OHLC crosshairs, drag/pinch/wheel interaction, zoom/reset buttons and keyboard inspection. Each interval is the duration of one candle. Aggregation uses only sessions inside the selected date range; expand the start date to compare multiple years.

Homepage statistics describe the stored watchlist, not the VN-Index or the entire exchange. Latest-session totals include only stocks with matching session dates. No news, live prices or investment returns are fabricated.

Vite forwards `/api` to `localhost:8080`. No frontend API key is required.

## Environment variables

| Variable | Local default | Purpose |
| --- | --- | --- |
| `DB_USER` | `backtestplat` | PostgreSQL username |
| `DB_PASSWORD` | `local-backtestplat` | Local development password |
| `DB_PORT` | `55432` | Database port published on the host |
| `DB_URL` | `jdbc:postgresql://localhost:55432/backtestplat` | Backend JDBC URL |
| `PORT` | `8080` | Backend HTTP port |
| `MARKET_DATA_IMPORT_ENABLED` | `false` | Run the one-time importer and exit |
| `MARKET_DATA_IMPORT_START` | `2021-01-01` | First historical date |
| `MARKET_DATA_CUTOFF` | `2026-09-20` | Fixed inclusive cutoff |

If you change `DB_PORT`, update `DB_URL` too. If you change `PORT`, update the proxy target in `frontend/vite.config.ts`. Compose reads `.env` automatically; Spring Boot needs exported variables as shown above. PostgreSQL initialization credentials apply only when the volume is first created. Editing `.env` does not change credentials inside an existing volume. The database binds only to `127.0.0.1`; these development credentials are not for public deployment.

## Tests and CI

From `backend/`:

```sh
./mvnw --batch-mode --no-transfer-progress verify
```

Default tests use H2. To run against the local Docker PostgreSQL instance:

```sh
TEST_DB_URL=jdbc:postgresql://localhost:55432/backtestplat \
TEST_DB_USER=backtestplat \
TEST_DB_PASSWORD=local-backtestplat \
./mvnw --batch-mode --no-transfer-progress test
```

Market-data integration tests roll back their changes. Use a dedicated test database when adding tests that commit data.

From `frontend/`:

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests cover 375, 768, 1024 and 1440px viewports, both themes, keyboard controls, reduced motion, draft persistence, data errors, chart interactions and automated accessibility checks.

From the repository root:

```sh
docker compose --env-file .env.example config --quiet
```

CI runs on pull requests and pushes to `main`, `feature/*`, `fix/*` and `test/*`. It validates Maven builds, H2/PostgreSQL tests, Compose configuration and frontend lint/unit/build/browser checks.

## Running a backtest

1. Start the database/backend/frontend and ensure historical prices have been imported.
2. Open `/backtest`, select a stock, date range, initial capital and fee percentage per side.
3. Click **Chạy backtest**. The backend simulates and saves the report; the URL gains a `run` ID.
4. Inspect return, drawdown, completed-trade win rate, equity and the order log. Use the curve slider to inspect any session, including with keyboard Home/End.
5. Keep the result URL to reopen it later. Editing the form does not change an existing report. **Lưu cấu hình nháp** only saves input settings in this browser.

The default provider is a plumbing mock, not the collaborator's Quant AI. Reports explicitly state the simulation assumptions.

## Business architecture

```text
Historical OHLCV -> Quant provider -> BUY / SELL / HOLD
                                        |
                              Backtest engine -> Execution
                                        |
                                 Portfolio -> Metrics
```

Quant supplies decisions only. The backend owns execution dates, fill prices, quantities, fees, cash and positions. A signal generated after session T may execute only at the OPEN of the next available session in the stored data. Stock/date uniqueness is enforced in the database.

The `mock-cycle-v1` provider emits BUY on session 1 and SELL on session 6, repeating every 10 stored sessions from the selected start. The engine supports one long position with whole shares (lot size 1), all-in purchases and full exits. Fees apply on both sides and are rounded to 2 decimal VND places. Signals on the final session or before a zero-volume session are recorded as unfilled. Open positions are marked at the final close; there is no forced liquidation. Metrics include total return, end-of-day maximum drawdown, fees, realized/unrealized P&L and win rate on completed round trips (null if none). No slippage, taxes, T+ settlement or separate corporate-action processing is simulated.

Phase 2 uses a deterministic mock, clearly labelled as simulation data. Phase 3 will connect the collaborator's Quant implementation through a separate provider adapter. Authentication, user management, Redis, Kafka and microservices are outside this MVP.

### Backtest API

```sh
curl -X POST http://localhost:8080/api/backtests \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"FPT","from":"2026-01-01","to":"2026-09-20","capital":100000000,"feePercent":0.15}'
```

The response contains `id`, `request`, `dataCutoff`, and `simulation` with `metrics`, daily `equity` and `orders`. Retrieve the same snapshot with `GET /api/backtests/{id}`. Each successful POST creates a new run; GET never reruns it. The database retains results across restarts. This local MVP has no authentication or automatic run deletion.

Dates must be between 2021-01-01 and the fixed cutoff, in ascending order, with at least two stored sessions. Capital accepts 1 through 1,000,000,000,000 VND; fees accept 0 through 5% per side, both with at most two decimal places. Validation errors return ProblemDetail (400), unknown stocks/results return 404, insufficient history returns 422, and database outages return 503.

## Historical data scope

The fixed snapshot ends on **2026-09-20**, interpreted in Asia/Ho_Chi_Minh. Only completed sessions returned by the source are stored. The cutoff does not advance when the app opens.

Default symbols, starting `2021-01-01`:

`ACB`, `FPT`, `GAS`, `HPG`, `MBB`, `MSN`, `MWG`, `PLX`, `PNJ`, `SSI`, `TCB`, `VCB`, `VHM`, `VIC`, `VNM`.

This watchlist covers several sectors, but is neither complete exchange coverage nor an investment recommendation. The verified local snapshot contains **22,296 price rows**, through **2026-09-18**, and occupies approximately **3.3 MB** including price indexes. Docker images, WAL and other database files are additional storage. Fifteen inconsistent source rows were logged and skipped.

There is no daily scheduler, startup catch-up or background market-data refresh. Further updates will be designed only when requested. Real Quant integration and daily updates are excluded from the current phase's completion criteria.

## Development workflow

- [Project status](docs/project-status.md)
- [Development log](docs/development-log.md)
- [Requested Git workflow](docs/workflow.md)

Each feature starts from updated `main`, has its own `feature/<name>` branch, is tested and committed, then pushed and merged. Remote feature branches are retained. No history rewrites or force pushes.
