# MVP status

Phase 1 is complete. Stop here until the user explicitly requests Phase 2.

[DONE] Project setup
[DONE] Database setup
[DONE] Frontend setup cleanup and README
[DONE] Stock storage
[DONE] Historical price storage
[DONE] Historical price API
[DONE] One-time historical data import through 2026-09-20
[DONE] Expanded historical dataset from 5 to 15 HOSE symbols
[DONE] Basic historical market data frontend
[DONE] Three-page UI redesign, Inter typography and stock search/sort
[DONE] Sci-fi dark and light gradient color themes
[DONE] Frontend backtest draft workspace (local save only)
[TODO] Quant provider interface and deterministic mock
[TODO] Order execution and portfolio
[TODO] Backtest engine and performance metrics
[TODO] Backtest result API
[TODO] Connect frontend backtest form to simulation API
[TODO] Result dashboard and equity curve
[TODO] Trade history
[TODO] Docker application stack
[TODO] Final integration testing

## Current scope — updated 2026-09-20

- Use a fixed historical dataset with an inclusive cutoff of **2026-09-20**, interpreted in Asia/Ho_Chi_Minh.
- Import only completed trading sessions available from the selected source, with trading dates no later than the cutoff. Do not invent bars for non-trading days or missing sessions.
- The cutoff is fixed; it does not advance when the application is opened later.
- No daily scheduler, startup catch-up, or background refresh in the current scope. Design future updates only when requested.
- Build the web application with a deterministic mock Quant provider first. The real Quant implementation will be supplied by the user's collaborator later.
- The Java importer uses `yfinance4j` with Yahoo Finance for ACB, FPT, GAS, HPG, MBB, MSN, MWG, PLX, PNJ, SSI, TCB, VCB, VHM, VIC and VNM, starting at 2021-01-01.
- Provider rows with missing or internally inconsistent OHLCV are skipped and logged rather than altered. The verified local snapshot contains 22,296 rows through 2026-09-18, none beyond the cutoff, and occupies 3,384 kB for `daily_prices` including indexes. The expanded import skipped 15 inconsistent provider rows.

## Phase boundaries

1. **Web and historical data:** stock storage, one-time historical import, price API and basic frontend.
2. **Backtesting with mock Quant:** execution, portfolio, fees, metrics, equity curve and trade history, followed by application packaging and integration checks.
3. **Real Quant integration (later):** connect the collaborator's code/API through the provider interface when supplied and requested.

Start a phase only on the user's instruction; complete its features sequentially and stop at the phase boundary.
Daily updates and real Quant integration are outside the current web MVP completion criteria. This scope update takes precedence over their earlier requirements in `docs/workflow.md`.
