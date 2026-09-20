# MVP status

Setup checkpoint only. Per user instruction, stop before business features and wait for model selection.

[DONE] Project setup
[DONE] Database setup
[DONE] Frontend setup cleanup and README
[TODO] Stock storage
[TODO] Historical price storage and API
[TODO] One-time historical data import through 2026-09-20
[TODO] Quant provider interface and deterministic mock
[TODO] Order execution and portfolio
[TODO] Backtest engine and performance metrics
[TODO] Backtest result API
[TODO] Frontend backtest form
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
- Data source, symbols and historical start date remain to be agreed when Phase 1 is requested. No market data has been downloaded at the setup checkpoint.

## Phase boundaries

1. **Web and historical data:** stock storage, one-time historical import, price API and basic frontend.
2. **Backtesting with mock Quant:** execution, portfolio, fees, metrics, equity curve and trade history, followed by application packaging and integration checks.
3. **Real Quant integration (later):** connect the collaborator's code/API through the provider interface when supplied and requested.

Start a phase only on the user's instruction; complete its features sequentially and stop at the phase boundary.
Daily updates and real Quant integration are outside the current web MVP completion criteria. This scope update takes precedence over their earlier requirements in `docs/workflow.md`.
