# BacktestPlat frontend

React + TypeScript + Vite. Setup screen only; no market or backtest features yet.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. API requests under `/api` will proxy to localhost:8080.

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The setup page supports light/dark/system themes, keyboard navigation and responsive layouts.
End-to-end tests cover 375/768/1024/1440px, reduced motion and automated accessibility checks.
See the [root README](../README.md) for Docker PostgreSQL and backend instructions.
