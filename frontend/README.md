# VN Stock Dashboard — Frontend

Feature 0 provides the React foundation only. Product screens and API integrations are intentionally not implemented yet.

## Requirements

- Node.js 24+
- npm 11+

## Commands

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm run lint:contract
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Vite development server proxies `/api`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`. Browser state is limited to non-sensitive UI preferences; authentication tokens must never be stored in local storage.
