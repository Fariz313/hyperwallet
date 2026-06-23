<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatAddress } from '$lib/utils/address';
  import { formatUsd, formatNumber } from '$lib/hyperliquid/utils';

  interface WalletListItem {
    address: string;
    label?: string;
    tags: string[];
    isActive: boolean;
    syncStatus: string;
    lastSyncedAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
  }

  interface WalletSyncEventPayload {
    address: string;
    syncedAt: string;
    snapshotCount: number;
    positionCount: number;
    fillCount: number;
    orderCount: number;
  }

  interface WalletErrorEventPayload {
    address: string;
    error: string;
    at: string;
  }

  interface WalletSyncEvent {
    type: 'wallet:synced';
    at: string;
    payload: WalletSyncEventPayload;
  }

  interface WalletErrorEvent {
    type: 'wallet:error';
    at: string;
    payload: WalletErrorEventPayload;
  }

  type WalletEvent = WalletSyncEvent | WalletErrorEvent;

  interface MarketListItem {
    symbol: string;
    name?: string;
    mid?: number;
    mark?: number;
    prevDayPrice?: number;
    change24h?: number;
    dayNtlVlm?: number;
    funding?: number;
    openInterest?: number;
    isFavorite: boolean;
    timestamp: string;
  }

  let wallets: WalletListItem[] = [];
  let markets: MarketListItem[] = [];
  let loading = false;
  let marketsLoading = false;
  let syncing = false;
  let lastEventAt: string | null = null;
  let eventSourceConnected = false;
  let message = '';
  let errorMessage = '';

  function formatRelativeTime(value: string | undefined): string {
    if (!value) return 'Never';
    const diff = Date.now() - new Date(value).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function statusClass(status: string): string {
    if (status === 'synced') return 'badge success';
    if (status === 'error') return 'badge danger';
    if (status === 'syncing' || status === 'warning') return 'badge warning';
    return 'badge';
  }

  function formatCompact(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  async function loadWallets() {
    if (!browser) return;
    loading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/wallets');
      if (!response.ok) throw new Error('Failed to load tracked wallets');
      const data = await response.json() as { wallets: WalletListItem[] };
      wallets = data.wallets;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load wallets';
    } finally {
      loading = false;
    }
  }

  async function loadMarkets() {
    if (!browser) return;
    marketsLoading = true;

    try {
      const response = await fetch('/api/markets?sort=volume');
      if (!response.ok) return;
      const data = await response.json() as { markets: MarketListItem[] };
      markets = data.markets;
    } catch {
      // Silently fail for market metrics
    } finally {
      marketsLoading = false;
    }
  }

  function connectSse() {
    if (!browser || eventSourceConnected) return;

    const eventSource = new EventSource('/api/realtime');

    eventSource.addEventListener('wallet:synced', (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as WalletSyncEventPayload;
      lastEventAt = new Date().toISOString();
      message = `Live update: ${formatAddress(payload.address)} synced`;
      void loadWallets();
    });

    eventSource.addEventListener('wallet:error', (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as WalletErrorEventPayload;
      errorMessage = `Sync error for ${formatAddress(payload.address)}: ${payload.error}`;
      void loadWallets();
    });

    eventSource.onopen = () => {
      eventSourceConnected = true;
      message = 'Connected to live updates';
    };

    eventSource.onerror = () => {
      eventSourceConnected = false;
      console.warn('[dashboard] SSE connection lost, retrying...');
    };
  }

  async function syncAll() {
    if (!browser) return;
    syncing = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/wallets/sync', { method: 'POST' });
      const data = await response.json() as { results?: Array<unknown>; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Failed to sync wallets');
      message = `Synced ${data.results!.length} active wallet(s)`;
      await loadWallets();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to sync wallets';
    } finally {
      syncing = false;
    }
  }

  onMount(() => {
    void loadWallets();
    void loadMarkets();
    connectSse();
  });
</script>

<svelte:head>
  <title>Dashboard · Hyperwallet</title>
</svelte:head>

<section class="hero dashboard-hero">
  <span class="badge success">Phase 6 · Wallet tracking · Market scanner · Alerts & Notifications</span>
  <h1>Hyperwallet</h1>
  <p>
    Real-time Hyperliquid wallet tracking and market scanner without private keys.
    Background worker syncs active wallets every 30s. Markets auto-refresh.
  </p>
  <div class="actions">
    <a class="button" href="/wallets">Manage wallets</a>
    <a class="button secondary" href="/markets">Market scanner</a>
  </div>
  {#if errorMessage}
    <p class="muted status-message" role="alert">{errorMessage}</p>
  {:else if message}
    <p class="muted status-message" role="status">{message}</p>
  {/if}
</section>

<section class="metric-grid" aria-label="Wallet tracking overview">
  <article class="metric-card">
    <span class="metric-label">Tracked wallets</span>
    <strong>{loading ? '...' : formatNumber(wallets.length, 0)}</strong>
    <p>Active wallets being polled.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Active</span>
    <strong>{loading ? '...' : formatNumber(wallets.filter(w => w.isActive).length, 0)}</strong>
    <p>Wallets with sync enabled.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Synced</span>
    <strong>{loading ? '...' : formatNumber(wallets.filter(w => w.syncStatus === 'synced').length, 0)}</strong>
    <p>Wallets with cached data.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Errors</span>
    <strong class="danger-text">{loading ? '...' : formatNumber(wallets.filter(w => w.syncStatus === 'error').length, 0)}</strong>
    <p>Wallets with sync errors.</p>
  </article>
  <article class="metric-card wide-metric">
    <span class="metric-label">Live updates</span>
    <strong class={eventSourceConnected ? 'success-text' : 'muted-text'}>{eventSourceConnected ? 'Connected (SSE)' : 'Disconnected'}</strong>
    <p>Server-Sent Events for real-time wallet sync.</p>
  </article>
</section>

<section class="metric-grid" aria-label="Market overview">
  <article class="metric-card">
    <span class="metric-label">Markets tracked</span>
    <strong>{marketsLoading ? '...' : formatNumber(markets.length, 0)}</strong>
    <p>Hyperliquid perp markets cached.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Favorites</span>
    <strong>{marketsLoading ? '...' : formatNumber(markets.filter(m => m.isFavorite).length, 0)}</strong>
    <p>Bookmarked markets.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Total 24h volume</span>
    <strong>{marketsLoading ? '...' : '$' + formatCompact(markets.reduce((sum, m) => sum + (m.dayNtlVlm ?? 0), 0))}</strong>
    <p>Sum of all perp volumes.</p>
  </article>
  <article class="metric-card wide-metric">
    <span class="metric-label">Last sync</span>
    <strong>{marketsLoading ? '...' : markets.length > 0 ? new Date(markets[0].timestamp).toLocaleTimeString() : 'Never'}</strong>
    <p>Latest market data timestamp.</p>
  </article>
</section>

<section class="grid" aria-label="Wallet list">
  <article class="card full-width-card">
    <div class="section-heading">
      <div>
        <h2>Tracked wallets</h2>
        <span class="small">Background worker polls active wallets every 30 seconds.</span>
      </div>
      <div class="actions compact-actions">
        <a class="button secondary" href="/wallets">Add wallet</a>
        <button class="button secondary" type="button" onclick={syncAll} disabled={syncing || wallets.length === 0}>
          {syncing ? 'Syncing...' : 'Sync all'}
        </button>
        <button class="button secondary" type="button" onclick={loadWallets} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>

    {#if loading && wallets.length === 0}
      <div class="empty-state">
        <span class="empty-icon">H</span>
        <p>Loading tracked wallets...</p>
      </div>
    {:else if wallets.length === 0}
      <div class="empty-state">
        <span class="empty-icon">0</span>
        <h3>No wallets tracked yet</h3>
        <p>Add a public Hyperliquid wallet address to start caching real-time data.</p>
        <a class="button" href="/wallets">Add your first wallet</a>
      </div>
    {:else}
      <div class="table-shell">
        {#each wallets as wallet (wallet.address)}
          <div class="list-item">
            <div>
              <strong>{wallet.label || 'Unnamed wallet'}</strong>
              <a class="muted small" href={`/wallets/${wallet.address}`}>{formatAddress(wallet.address)}</a>
              {#if wallet.tags.length > 0}
                <span class="muted small">{wallet.tags.join(', ')}</span>
              {/if}
              {#if wallet.lastSyncedAt}
                <span class="muted small">Updated {formatRelativeTime(wallet.lastSyncedAt)}</span>
              {:else}
                <span class="muted small">Not synced yet</span>
              {/if}
            </div>
            <div class="actions">
              <span class={statusClass(wallet.syncStatus)}>{wallet.syncStatus}</span>
              <a class="button secondary" href={`/wallets/${wallet.address}`}>Detail</a>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </article>
</section>

<section class="grid" aria-label="Quick links">
  <article class="card third">
    <h2>Wallets</h2>
    <p>Add and manage tracked wallets. Sync snapshots, positions, fills, and orders.</p>
    <a class="button secondary" href="/wallets">Open wallets</a>
  </article>
  <article class="card third">
    <h2>Market scanner</h2>
    <p>Browse, search, and favorite perp markets. Sort by volume, gainers, losers, funding, or OI.</p>
    <a class="button secondary" href="/markets">Open markets</a>
  </article>
  <article class="card third">
    <h2>Settings</h2>
    <p>Configure notification preferences, theme, and refresh interval.</p>
    <a class="button secondary" href="/settings">Open settings</a>
  </article>
</section>

<style>
  .status-message {
    margin: 0.75rem 0 0;
  }

  .danger-text {
    color: #fb7185;
  }

  .success-text {
    color: #22c55e;
  }

  .muted-text {
    color: #94a3b8;
  }
</style>
