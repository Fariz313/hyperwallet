# Hyperwallet

Hyperwallet is a standalone SvelteKit SSR PWA for read-only real-time Hyperliquid wallet tracking.

## Status

Phase 3 Hyperliquid client layer is complete:

- SvelteKit SSR app shell
- Responsive layout and navigation
- Dashboard, wallets, markets, alerts, leaderboard, notifications, and settings pages
- PWA manifest and service worker shell
- Health endpoint at `/api/health`
- Mongo connection helper and isolated Hyperwallet DB configuration
- Mongoose models, indexes, and collection naming support
- DB utility scripts for sample wallet seeding and index inspection
- Reusable public Hyperliquid API client with typed requests, retries, rate limiting, and error mapping
- Address validation, symbol normalization, and number formatting utilities
- Parent repo excludes `hyperwallet/`; this folder has its own Git repository

## Install

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # Start Vite/SvelteKit dev server
npm run build      # Build production app
npm run preview    # Preview production build
npm run check      # Run svelte-check
npm run lint       # Check formatting
npm run format     # Format files
npm run db:seed    # Insert sample tracked wallets into Mongo
npm run db:indexes # Inspect model indexes in Mongo
```

## Phase 2 DB Notes

Hyperwallet uses an isolated Mongo database by default:

- `MONGODB_URI=mongodb://127.0.0.1:27017/celestial_hyperwallet`
- `HYPERWALLET_DB_NAME=celestial_hyperwallet`
- `HYPERWALLET_COLLECTION_PREFIX=`

If the main app later needs shared storage, set a prefix such as `hyperwallet_` and point `MONGODB_URI` to the main app database. The default prefix is empty, so Phase 2 collections are created in the isolated `celestial_hyperwallet` database.

## Phase 3 Hyperliquid Client Notes

The public Hyperliquid client is implemented under [`src/lib/hyperliquid/`](src/lib/hyperliquid/index.ts:1).

Configuration defaults:

- `HYPERLIQUID_API_URL=https://api.hyperliquid.xyz`
- `HYPERLIQUID_NETWORK=mainnet`
- `HYPERLIQUID_REQUEST_TIMEOUT_MS=15000`
- `HYPERLIQUID_MAX_RETRIES=2`
- `HYPERLIQUID_RETRY_DELAY_MS=750`

Client features:

- POST wrapper for Hyperliquid public info endpoint
- Configurable request timeout, retry count, and retry delay
- Conservative request spacing through [`HyperliquidRateLimiter`](src/lib/hyperliquid/rateLimiter.ts:1)
- Retry handling for network errors, aborts, and 429/5xx responses
- Error mapping through `HyperliquidApiError`
- Wallet address normalization and validation
- Symbol normalization and numeric/USD formatting helpers

## Phase Plan

See [`plan.md`](plan.md) for the full architecture and implementation phases.
