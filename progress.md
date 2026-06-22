# Hyperwallet Progress Log

## 2026-06-21

### Phase 1 - SvelteKit SSR PWA Skeleton

Completed Phase 1 skeleton inside the standalone `hyperwallet` project.

#### Completed

- Created SvelteKit project metadata:
  - [`package.json`](package.json:1)
  - [`svelte.config.js`](svelte.config.js:1)
  - [`vite.config.ts`](vite.config.ts:1)
  - [`tsconfig.json`](tsconfig.json:1)
- Added SvelteKit app shell with Node adapter:
  - [`package.json`](package.json:1)
  - [`svelte.config.js`](svelte.config.js:1)
  - [`src/app.html`](src/app.html:1)
  - [`src/app.css`](src/app.css:1)
  - [`src/app.d.ts`](src/app.d.ts:1)
  - [`src/routes/+layout.ts`](src/routes/+layout.ts:1)
  - [`src/routes/+layout.svelte`](src/routes/+layout.svelte:1)
- Added SSR pages for the main app routes:
  - [`src/routes/+page.svelte`](src/routes/+page.svelte:1)
  - [`src/routes/wallets/+page.svelte`](src/routes/wallets/+page.svelte:1)
  - [`src/routes/wallets/[address]/+page.ts`](src/routes/wallets/[address]/+page.ts:1)
  - [`src/routes/wallets/[address]/+page.svelte`](src/routes/wallets/[address]/+page.svelte:1)
  - [`src/routes/markets/+page.svelte`](src/routes/markets/+page.svelte:1)
  - [`src/routes/alerts/+page.svelte`](src/routes/alerts/+page.svelte:1)
  - [`src/routes/leaderboard/+page.svelte`](src/routes/leaderboard/+page.svelte:1)
  - [`src/routes/notifications/+page.svelte`](src/routes/notifications/+page.svelte:1)
  - [`src/routes/settings/+page.svelte`](src/routes/settings/+page.svelte:1)
- Added Phase 1 utility and API:
  - [`src/lib/utils/address.ts`](src/lib/utils/address.ts:1)
  - [`src/routes/api/health/+server.ts`](src/routes/api/health/+server.ts:1)
- Added PWA assets and icon generation:
  - [`static/manifest.webmanifest`](static/manifest.webmanifest:1)
  - [`static/sw.js`](static/sw.js:1)
  - [`static/icons/icon.svg`](static/icons/icon.svg:1)
  - [`static/icons/icon-192.png`](static/icons/icon-192.png:1)
  - [`static/icons/icon-512.png`](static/icons/icon-512.png:1)
  - [`scripts/generate-icons.cjs`](scripts/generate-icons.cjs:1)
  - [`src/lib/pwa/registerServiceWorker.ts`](src/lib/pwa/registerServiceWorker.ts:1)
  - [`src/lib/pwa/types.ts`](src/lib/pwa/types.ts:1)
- Added project docs and environment template:
  - [`README.md`](README.md:1)
  - [`.env.example`](.env.example:1)
  - [`.gitignore`](.gitignore:1)

### Responsive Mobile Optimization

Optimized the Phase 1 UI for small mobile screens, tablet layouts, and desktop widths without changing the main app.

#### Completed

- Reworked the global shell for mobile-first responsive behavior:
  - Responsive sticky topbar with toggle-based mobile navbar.
  - Mobile side menu with overlay, close-on-navigation behavior, and desktop wrapped primary navigation.
  - Responsive content width, spacing, cards, buttons, forms, badges, and table rows.
- Updated the app layout markup to support compact brand text and safe navigation toggling:
  - [`src/routes/+layout.svelte`](src/routes/+layout.svelte:27)
- Improved every Phase 1 page layout:
  - Dashboard cards now include compact metric labels: [`src/routes/+page.svelte`](src/routes/+page.svelte:15)
  - Wallet form and tracked wallet preview now use responsive stacked/mobile rows: [`src/routes/wallets/+page.svelte`](src/routes/wallets/+page.svelte:24)
  - Wallet detail now uses responsive metric cards and compact actions: [`src/routes/wallets/[address]/+page.svelte`](src/routes/wallets/[address]/+page.svelte:16)
  - Markets, alerts, leaderboard, notifications, and settings pages now use responsive section headings, table shells, empty states, and icon cards.
- Added responsive CSS helpers for:
  - Mobile actions and compact actions.
  - Metric grids.
  - Responsive table rows.
  - Empty states.
  - Section headings.
  - Address overflow wrapping.
  - Compact card icons.

### PWA Install Alert

Added a browser install alert in the shared app layout so users are prompted to install Hyperwallet when opening the app.

#### Completed

- Added install-prompt state and handlers in the root layout:
  - Captures Chrome/Edge `beforeinstallprompt` events.
  - Stores the deferred prompt and exposes an Install button.
  - Adds an iOS Safari fallback with Add to Home Screen instructions.
  - Hides the alert automatically when the app is already running as a standalone PWA.
  - [`src/routes/+layout.svelte`](src/routes/+layout.svelte:25)
- Added responsive install alert styling:
  - Sticky banner below the topbar.
  - Mobile single-column action layout.
  - Desktop two-column layout with separate action buttons.
  - [`src/app.css`](src/app.css:185)

#### Verification

- Installed dependencies with `npm install`.
- Ran `npm run format`: Prettier formatted project files.
- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran `npm run build`: production build completed successfully with `@sveltejs/adapter-node`.
- Initial `adapter-auto` warning was fixed by switching to an explicit Node adapter.
- Placeholder PNG icons were replaced with generated valid PNG icon files.
- Mobile responsive changes were verified with:
  - `npm run format`
  - `npm run check`: 0 errors and 0 warnings
  - `npm run build`: successful production build

#### Git Status

- Parent repo excludes `hyperwallet/` via parent [`.gitignore`](../.gitignore:44).
- Parent `git status --short` does not show `hyperwallet/`.
- `hyperwallet` has its own nested Git repository initialized under `hyperwallet/.git`.
- Hyperwallet nested repo status currently shows all Phase 1 files as untracked, ready for the first commit.

#### Notes

- No main-app code was changed for Hyperwallet functionality.
- Main app remains isolated from Hyperwallet.
- Mobile/tablet/desktop responsive styling is contained inside `hyperwallet` only.

### Phase 2 - DB and Models

Completed the Phase 2 Mongo/Mongoose database layer for Hyperwallet without changing the main app.

#### Completed

- Added Phase 2 dependencies:
  - [`package.json`](package.json:16)
  - [`package-lock.json`](package-lock.json:1)
- Added Mongo environment configuration and collection naming helper:
  - [`src/server/config.ts`](src/server/config.ts:1)
  - [`src/server/db.ts`](src/server/db.ts:1)
  - `.env.example` documents `MONGODB_URI`, `HYPERWALLET_DB_NAME`, `HYPERWALLET_COLLECTION_PREFIX`, and `MAIN_APP_API_URL`.
- Added Mongoose models for the planned Phase 2 collections:
  - [`src/server/models/TrackedWallet.ts`](src/server/models/TrackedWallet.ts:1)
  - [`src/server/models/WalletSnapshot.ts`](src/server/models/WalletSnapshot.ts:1)
  - [`src/server/models/WalletFill.ts`](src/server/models/WalletFill.ts:1)
  - [`src/server/models/WalletOrder.ts`](src/server/models/WalletOrder.ts:1)
  - [`src/server/models/WalletPosition.ts`](src/server/models/WalletPosition.ts:1)
  - [`src/server/models/MarketSnapshot.ts`](src/server/models/MarketSnapshot.ts:1)
  - [`src/server/models/PriceAlert.ts`](src/server/models/PriceAlert.ts:1)
  - [`src/server/models/WalletActivityAlert.ts`](src/server/models/WalletActivityAlert.ts:1)
  - [`src/server/models/NotificationSubscription.ts`](src/server/models/NotificationSubscription.ts:1)
  - [`src/server/models/index.ts`](src/server/models/index.ts:1)
- Added indexes for uniqueness, wallet lookups, time-series queries, alert filtering, and notification subscriptions.
- Added DB utility scripts:
  - [`scripts/seed-wallets.ts`](scripts/seed-wallets.ts:1)
  - [`scripts/ensure-indexes.ts`](scripts/ensure-indexes.ts:1)
- Added package scripts in [`package.json`](package.json:6):
  - `npm run db:seed`
  - `npm run db:indexes`
- Updated [`README.md`](README.md:1) with Phase 2 DB notes and collection naming behavior.

#### Verification

- Ran `npm run format`: Prettier formatted the new server and script files.
- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran `npm run build`: the default build hit a Node.js heap out-of-memory error after the new Mongoose/TypeScript files were added.
- Ran the direct production build with a larger heap and it completed successfully:
  - `node --max-old-space-size=4096 node_modules/vite/bin/vite.js build`

#### Notes

- No main-app code was changed.
- Hyperwallet remains a standalone nested project.
- The default DB decision is an isolated `celestial_hyperwallet` database with no collection prefix.
- Shared-main-DB mode remains possible later by setting `HYPERWALLET_COLLECTION_PREFIX=hyperwallet_` and pointing `MONGODB_URI` to the main app database.
- Mongo-backed scripts require a running Mongo instance and valid `MONGODB_URI`.
- Parent Git repository still excludes `hyperwallet/`; Hyperwallet has its own nested Git repository.

### Phase 3 - Hyperliquid Client

Completed the Phase 3 public Hyperliquid API client layer without changing the main app.

#### Completed

- Added reusable Hyperliquid client utilities under [`src/lib/hyperliquid/`](src/lib/hyperliquid/index.ts:1):
  - [`src/lib/hyperliquid/config.ts`](src/lib/hyperliquid/config.ts:1)
  - [`src/lib/hyperliquid/client.ts`](src/lib/hyperliquid/client.ts:1)
  - [`src/lib/hyperliquid/rateLimiter.ts`](src/lib/hyperliquid/rateLimiter.ts:1)
  - [`src/lib/hyperliquid/types.ts`](src/lib/hyperliquid/types.ts:1)
  - [`src/lib/hyperliquid/utils.ts`](src/lib/hyperliquid/utils.ts:1)
- Added typed request/response models for:
  - Hyperliquid config
  - API error context
  - Hyperliquid meta
  - clearinghouse state
  - fills
  - historical orders
- Added public API wrapper methods:
  - `getMeta()`
  - `getClearinghouseState()`
  - `getUserFills()`
  - `getHistoricalOrders()`
- Added address validation and normalization:
  - Requires `0x` plus 40 lowercase hex characters.
  - Returns lowercase canonical addresses.
- Added symbol normalization and number formatting helpers:
  - `normalizeSymbol()`
  - `formatNumber()`
  - `formatUsd()`
  - `parsePositiveNumber()`
- Added rate-limit handling with request spacing through [`HyperliquidRateLimiter`](src/lib/hyperliquid/rateLimiter.ts:1).
- Added retry and error handling for:
  - Network failures
  - Abort timeouts
  - HTTP 429
  - HTTP 5xx responses
- Updated `.env.example` with Phase 3 Hyperliquid client variables.
- Updated [`README.md`](README.md:1) with Phase 3 client notes.

#### Verification

- Ran `npm run format`: Prettier formatted the new Hyperliquid client files.
- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran the direct production build with a larger heap:
  - `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build`
  - Build completed successfully.
- The previous 4096 MB heap build attempt failed during Vite client chunk rendering with a process out-of-memory error, so the 8192 MB heap build is now the passing verification command.

#### Notes

- No main-app code was changed.
- Hyperwallet remains a standalone nested project.
- The Phase 3 client is a reusable data access layer only; wallet CRUD, background sync workers, and cached DB writes remain for Phase 4.
- The client uses public Hyperliquid API calls only and does not require private keys.
- Parent Git repository still excludes `hyperwallet/`; Hyperwallet has its own nested Git repository.

## 2026-06-22

### Phase 4 - Wallet Tracking

Completed the Phase 4 wallet tracking layer with real-time background sync and live updates, without changing the main app.

#### Completed

- **Background tracker worker** ([`src/server/workers/trackerWorker.ts`](src/server/workers/trackerWorker.ts:1)):
  - Periodic sync of all active tracked wallets from Hyperliquid public API.
  - Default 30-second interval between sync rounds.
  - Runs immediately on startup, then on the interval.
  - Tracks stats: total runs, errors, last run duration.
  - Timer is "unref'd" so it doesn't prevent process exit.
  - Integrated with the existing [`walletEvents`](src/server/events/walletEvents.ts:1) event bus for live event emission.

- **SSE realtime endpoint** ([`src/routes/api/realtime/+server.ts`](src/routes/api/realtime/+server.ts:1)):
  - Server-Sent Events endpoint for live wallet sync events.
  - Sends `wallet:synced` and `wallet:error` events as they happen.
  - Sends latest event immediately on connection.
  - Keep-alive pings every 15 seconds to prevent proxy timeouts.
  - Auto-closes after 5 minutes of inactivity (browser reconnects automatically).
  - Cleans up on client disconnect via `request.signal`.

- **Updated dashboard** ([`src/routes/+page.svelte`](src/routes/+page.svelte:1)):
  - Shows live wallet metrics: tracked count, active count, synced count, error count.
  - SSE connection status indicator (connected/disconnected).
  - Real-time wallet list with sync status badges, last-relative-time display.
  - Sync-all button, refresh button, add-wallet link.
  - Empty state with CTA to add the first wallet.
  - Quick-link cards to wallets, markets, and settings pages.
  - Phase 4 badge header with worker description.

- **Tracker worker integration** ([`src/hooks.server.ts`](src/hooks.server.ts:1)):
  - DB connection and tracker worker startup on first server request.
  - Graceful shutdown on SIGINT/SIGTERM: stops worker and disconnects DB.
  - Worker interval set to 30 seconds.

- **Updated layout footer** ([`src/routes/+layout.svelte`](src/routes/+layout.svelte:146)):
  - Footer now reads "Phase 4 · Wallet tracking · Background sync · SSE live updates · Read-only"

- **Existing Phase 4 infrastructure** (already built in prior sessions):
  - [`src/server/services/walletSync.ts`](src/server/services/walletSync.ts:1): Full wallet sync service with snapshot, position, fill, and order caching.
  - [`src/server/services/wallets.ts`](src/server/services/wallets.ts:1): Wallet CRUD operations (create, list, update, delete).
  - [`src/server/services/walletDetails.ts`](src/server/services/walletDetails.ts:1): Wallet detail loader combining all cached data.
  - [`src/server/events/walletEvents.ts`](src/server/events/walletEvents.ts:1): Event bus for wallet sync events.
  - [`src/routes/api/wallets/+server.ts`](src/routes/api/wallets/+server.ts:1): GET/POST API for wallets.
  - [`src/routes/api/wallets/[address]/+server.ts`](src/routes/api/wallets/[address]/+server.ts:1): GET/PATCH/DELETE API for individual wallets.
  - [`src/routes/api/wallets/[address]/sync/+server.ts`](src/routes/api/wallets/[address]/sync/+server.ts:1): POST API to sync a single wallet.
  - [`src/routes/api/wallets/sync/+server.ts`](src/routes/api/wallets/sync/+server.ts:1): POST API to sync all active wallets.
  - [`src/routes/api/wallets/events/+server.ts`](src/routes/api/wallets/events/+server.ts:1): Long-polling event endpoint.
  - [`src/routes/wallets/+page.svelte`](src/routes/wallets/+page.svelte:1): Wallet management UI with add/sync/delete.
  - [`src/routes/wallets/[address]/+page.svelte`](src/routes/wallets/[address]/+page.svelte:1): Wallet detail page with positions, fills, orders.
  - [`src/routes/wallets/[address]/proxy+page.ts`](src/routes/wallets/[address]/proxy+page.ts:1): SSR page data loader for wallet detail.
  - [`scripts/sync-wallets.ts`](scripts/sync-wallets.ts:1): CLI script for manual wallet sync.

#### New Files Added

- [`src/server/workers/trackerWorker.ts`](src/server/workers/trackerWorker.ts:1)
- [`src/routes/api/realtime/+server.ts`](src/routes/api/realtime/+server.ts:1)

#### Verification

- Ran `npm run format`: Prettier formatted all new and modified files.
- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran the direct production build with a larger heap:
  - `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build`
  - Build completed successfully.

#### Notes

- No main-app code was changed.
- Hyperwallet remains a standalone nested project.
- The background tracker worker runs in the same Node.js process as the SvelteKit server.
- SSE endpoint provides true real-time updates; the existing long-polling endpoint remains as a fallback.
- The tracker worker handles per-wallet errors gracefully, updating syncStatus per wallet without failing the entire round.
- Alerts, leaderboard, and notification phases remain for future development.

### Phase 5 - Market Scanner

Completed the Phase 5 market scanner with full browse, search, favorite, sort, and 24h price change display, without changing the main app.

#### Completed

- **24h price change support** ([`src/lib/hyperliquid/markets.ts`](src/lib/hyperliquid/markets.ts:1)):
  - Added `prevDayPrice` to `MarketSnapshotInput` and `MarketListItem` interfaces.
  - Added computed `change24h` field (percent change) in `mapMarketSnapshotDocToListItem()`.
  - Updated `mapMetaAndAssetCtxsToMarketInputs` to pass through `prevDayPrice` from the Hyperliquid asset context.

- **MarketSnapshot model update** ([`src/server/models/MarketSnapshot.ts`](src/server/models/MarketSnapshot.ts:1)):
  - Added `prevDayPrice: Number` field to the schema and document interface.

- **Market sync service update** ([`src/server/services/markets.ts`](src/server/services/markets.ts:1)):
  - `marketInputToDoc()` now includes `prevDayPrice`.
  - `listMarkets()` now accepts a `sort` parameter supporting: `volume`, `funding`, `oi`, `gainers`, `losers`.

- **Market list API update** ([`src/routes/api/markets/+server.ts`](src/routes/api/markets/+server.ts:1)):
  - Added `sort` query parameter to GET endpoint.
  - Added PATCH endpoint for favorite toggle (`symbol`, `isFavorite` body).

- **Full market scanner UI** ([`src/routes/markets/+page.svelte`](src/routes/markets/+page.svelte:1)):
  - Complete rewrite with rich scanner functionality:
    - Browseable table with mid price, 24h change (color-coded green/red), 24h volume, funding rate, open interest.
    - **Favorite toggle**: Clickable star icon per row with optimistic UI update and PATCH API call.
    - **Sort controls**: Pill-style buttons for 24h Volume (default), Top Gainers, Top Losers, Funding Rate, Open Interest.
    - **Search**: Debounced text input filtering by symbol.
    - **Auto-refresh**: Markets list refreshes every 30 seconds automatically.
    - **Sync button**: Manual market metadata sync from Hyperliquid.
    - **Responsive**: Mobile view shows only asset name and favorite star; desktop shows full data columns.
    - **Empty state** with CTA to sync markets when no data exists.

- **Updated dashboard** ([`src/routes/+page.svelte`](src/routes/+page.svelte:1)):
  - New market metrics section with cards for: markets tracked count, favorites count, total 24h volume (sum), last sync timestamp.
  - Hero badge updated to "Phase 5 · Wallet tracking · Market scanner".
  - Market scanner quick-link card updated with richer description.

- **Updated layout footer** ([`src/routes/+layout.svelte`](src/routes/+layout.svelte:146)):
  - Footer now reads "Phase 5 · Wallet tracking · Market scanner · Background sync · SSE live updates · Read-only"

#### Files Modified

- [`src/server/models/MarketSnapshot.ts`](src/server/models/MarketSnapshot.ts:1): Added `prevDayPrice` field.
- [`src/lib/hyperliquid/markets.ts`](src/lib/hyperliquid/markets.ts:1): Added `prevDayPrice`, `change24h` fields; updated mapping functions.
- [`src/server/services/markets.ts`](src/server/services/markets.ts:1): Added `prevDayPrice` to doc mapping, `sort` param to `listMarkets()`.
- [`src/routes/api/markets/+server.ts`](src/routes/api/markets/+server.ts:1): Added `sort` query param, PATCH favorite endpoint.
- [`src/routes/markets/+page.svelte`](src/routes/markets/+page.svelte:1): Full market scanner rewrite.
- [`src/routes/+page.svelte`](src/routes/+page.svelte:1): Added market metrics section.
- [`src/routes/+layout.svelte`](src/routes/+layout.svelte:1): Footer updated to Phase 5.

#### Verification

- Ran `npm run format`: Prettier formatted all modified files.
- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran the direct production build with a larger heap:
  - `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build`
  - Build completed successfully.

#### Notes

- No main-app code was changed.
- Hyperwallet remains a standalone nested project.
- Market `change24h` is computed client-side from `mid` and `prevDayPrice` to avoid storing volatile computed fields.
- Gainers/losers sorting is done client-side since `change24h` is not stored in MongoDB.
- Favorite state persists in MongoDB via the `isFavorite` boolean on `MarketSnapshot`.
- Alerts, leaderboard, and notification phases remain for future development.
- Parent Git repository still excludes `hyperwallet/`; Hyperwallet has its own nested Git repository.

### PWA Fixes — iOS Support, Proper Caching Strategy, Svelte 5 Runes Mode

Fixed the Progressive Web App setup with proper caching strategies, iOS PWA support, service worker update detection, and Svelte 5 runes mode compatibility.

#### Changes Made

- **iOS PWA meta tags** ([`src/app.html`](src/app.html:1)):
  - Added `apple-mobile-web-app-capable` (standalone mode on iOS).
  - Added `apple-mobile-web-app-status-bar-style: black-translucent` (edge-to-edge display).
  - Added `apple-mobile-web-app-title` (Hyperwallet).
  - Added `apple-touch-icon` link to 192×192 PNG.
  - Added `viewport-fit=cover` to viewport meta for notch support.

- **Apple touch icon** ([`static/icons/apple-touch-icon.png`](static/icons/apple-touch-icon.png:1)):
  - Created 192×192 PNG copy for iOS home screen icon.

- **Service worker rewrite** ([`static/sw.js`](static/sw.js:1)):
  - **Three named caches**: `hyperwallet-v1` (navigation/shell), `hyperwallet-static-v1` (icons/manifest), `hyperwallet-api-v1` (API responses).
  - **Network-first strategy** for API (`/api/`) and navigation (`text/html`) requests: fetch from network, fall back to cache on failure.
  - **Cache-first strategy** for static assets (icons, manifest, fonts): serve from cache, update cache in background.
  - **Offline fallback**: navigation requests that fail network and cache return the cached root page.
  - **Push notification handlers**: preserved `push` event listener with notification display logic.
  - **Cache cleanup**: `activate` event deletes old cache versions.
  - **Install event**: pre-caches shell and static assets on first install.

- **Manifest update** ([`static/manifest.webmanifest`](static/manifest.webmanifest:1)):
  - Added `"categories": ["finance", "cryptocurrency", "utilities"]` field.

- **Registration with update detection** ([`src/lib/pwa/registerServiceWorker.ts`](src/lib/pwa/registerServiceWorker.ts:1)):
  - Enhanced `registerServiceWorker()` with `updatefound` event listener to detect new service worker versions.
  - Added `controllerchange` event listener to auto-reload the page when a new SW takes over.
  - Logs registration success/failure and update events to console.

- **Svelte 5 runes mode** ([`src/routes/+layout.svelte`](src/routes/+layout.svelte:1)):
  - Changed reactive variables from `let` to `$state(...)` (e.g., `navOpen`, `deferredPrompt`, `showInstallAlert`, `iosInstallFallback`).
  - Changed `let { children }` to `let { children }: { children?: import('svelte').Snippet } = $props()` for typed slot content.
  - Changed `<slot />` to `{@render children?.()}`.
  - Changed all `on:click` event handlers to `onclick` (Svelte 5 syntax).
  - Install alert UI (beforeinstallprompt capture, iOS fallback, dismiss) preserved in runes mode.

#### Verification

- Ran `npm run check`: SvelteKit sync and `svelte-check` completed with 0 errors and 0 warnings.
- Ran production build with larger heap:
  - `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build`
  - Build completed successfully.

#### Notes

- No main-app code was changed.
- Hyperwallet remains a standalone nested project.
- The Svelte 5 runes migration was required to fix mixed event handler syntax (`on:click` is not valid in Svelte 5 runes mode with `<svelte:options runes={true} />`).
- The service worker now uses explicit cache names to avoid collisions with other apps on the same origin.
- iOS PWA support requires the `apple-touch-icon` PNG and the four iOS-specific `<meta>` tags — manifest alone is insufficient for iOS.
