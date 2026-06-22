<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { formatUsd } from '$lib/hyperliquid/utils';

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
    category?: string;
    assetClass?: string;
    isFavorite: boolean;
    timestamp: string;
  }

  interface SyncMarketsResult {
    marketCount: number;
    syncedAt: string;
    stale: boolean;
  }

  let markets: MarketListItem[] = [];
  let search = '';
  let sort = 'volume';
  let loading = false;
  let syncing = false;
  let errorMessage = '';
  let syncMessage = '';
  let searchTimeout: number | undefined;
  let autoRefreshInterval: number | undefined;
  let lastRefreshAt = '';

  type SortOption = { value: string; label: string };
  const sortOptions: SortOption[] = [
    { value: 'volume', label: '24h Volume' },
    { value: 'gainers', label: 'Top Gainers' },
    { value: 'losers', label: 'Top Losers' },
    { value: 'funding', label: 'Funding Rate' },
    { value: 'oi', label: 'Open Interest' },
  ];

  function formatCompact(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatFunding(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';
    return `${(value * 100).toFixed(4)}%`;
  }

  function formatChangePct(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(2)}%`;
  }

  function changeClass(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '';
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  }

  function formatTime(value: string | undefined): string {
    if (!value) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  function scheduleLoad() {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => void loadMarkets(), 250);
  }

  function updateSort(newSort: string) {
    sort = newSort;
    void loadMarkets();
  }

  async function loadMarkets() {
    loading = true;
    errorMessage = '';

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (sort !== 'volume') params.set('sort', sort);

      const response = await fetch(`/api/markets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load markets');

      const data = (await response.json()) as { markets: MarketListItem[] };
      let list = data.markets;

      // Client-side sorting for gainers/losers since change24h is computed
      if (sort === 'gainers') {
        list = list.sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity));
      } else if (sort === 'losers') {
        list = list.sort((a, b) => (a.change24h ?? Infinity) - (b.change24h ?? Infinity));
      }

      markets = list;
      lastRefreshAt = new Date().toLocaleTimeString();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load markets';
    } finally {
      loading = false;
    }
  }

  async function syncMarkets(force = false) {
    syncing = true;
    syncMessage = '';
    errorMessage = '';

    try {
      const response = await fetch('/api/markets/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = (await response.json()) as { result?: SyncMarketsResult; error?: string };

      if (!response.ok) throw new Error(data.error ?? 'Failed to sync markets');

      syncMessage = `Synced ${data.result?.marketCount ?? 0} market(s) from Hyperliquid.`;
      await loadMarkets();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to sync markets';
    } finally {
      syncing = false;
    }
  }

  async function toggleFavorite(market: MarketListItem) {
    const previous = market.isFavorite;
    market.isFavorite = !market.isFavorite;

    try {
      const response = await fetch('/api/markets', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ symbol: market.symbol, isFavorite: market.isFavorite }),
      });

      if (!response.ok) {
        market.isFavorite = previous;
        throw new Error('Failed to update favorite');
      }

      // Re-sort favorites to top
      void loadMarkets();
    } catch (error) {
      market.isFavorite = previous;
      errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
    }
  }

  onMount(() => {
    void loadMarkets();
    // Auto-refresh every 30 seconds
    autoRefreshInterval = window.setInterval(() => void loadMarkets(), 30_000);

    return () => {
      window.clearTimeout(searchTimeout);
      window.clearInterval(autoRefreshInterval);
    };
  });
</script>

<svelte:head>
  <title>Markets · Hyperwallet</title>
</svelte:head>

<section class="hero">
  <span class="badge">Phase 5 · Market scanner</span>
  <h1>Live Hyperliquid market overview.</h1>
  <p>
    Browse, search, and favorite Hyperliquid perp markets.
    Sort by 24h volume, price change, funding rate, or open interest.
    Data refreshes automatically every 30s.
  </p>
  <div class="actions compact-actions">
    <button class="button" type="button" onclick={() => syncMarkets(true)} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync markets'}
    </button>
    <button class="button secondary" type="button" onclick={loadMarkets} disabled={loading}>
      {loading ? 'Loading...' : 'Refresh'}
    </button>
  </div>
</section>

<section class="card">
  <div class="section-heading">
    <div>
      <h2>Markets</h2>
      <p class="muted small">
        {markets.length} market(s)
        {lastRefreshAt ? `· Last refresh at ${lastRefreshAt}` : ''}
      </p>
    </div>
  </div>

  <div class="toolbar">
    <label class="search-label">
      <span>Search</span>
      <input
        bind:value={search}
        oninput={scheduleLoad}
        placeholder="BTC, ETH, SOL..."
        autocomplete="off"
      />
    </label>

    <div class="sort-group">
      {#each sortOptions as opt}
        <button
          class="sort-chip"
          class:active={sort === opt.value}
          type="button"
          onclick={() => updateSort(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  {#if syncMessage}
    <p class="muted status-message" role="status">{syncMessage}</p>
  {/if}

  {#if errorMessage}
    <p class="muted danger-text" role="alert">{errorMessage}</p>
  {/if}

  {#if loading && markets.length === 0}
    <div class="empty-state">
      <span class="empty-icon">↻</span>
      <p>Loading cached markets...</p>
    </div>
  {:else if markets.length === 0}
    <div class="empty-state">
      <span class="empty-icon">M</span>
      <p>No cached markets yet. Run a market sync to pull Hyperliquid metadata and asset context.</p>
    </div>
  {:else}
    <div class="table-shell" aria-label="Hyperliquid markets">
      <div class="table-row header-row">
        <div class="col-asset">
          <strong>Asset</strong>
        </div>
        <div class="col-price">
          <span class="badge">Mid price</span>
        </div>
        <div class="col-change">
          <span class="badge">24h change</span>
        </div>
        <div class="col-volume">
          <span class="badge">24h volume</span>
        </div>
        <div class="col-funding">
          <span class="badge">Funding</span>
        </div>
        <div class="col-oi">
          <span class="badge">OI</span>
        </div>
        <div class="col-fav">
          <span class="badge" aria-label="Favorite">★</span>
        </div>
      </div>
      {#each markets as market (market.symbol)}
        <div class="table-row">
          <div class="col-asset">
            <strong>{market.name || market.symbol}</strong>
            <span class="muted small">{market.symbol}</span>
          </div>
          <div class="col-price">
            <strong>{formatUsd(market.mid)}</strong>
          </div>
          <div class="col-change {changeClass(market.change24h)}">
            <strong>{formatChangePct(market.change24h)}</strong>
          </div>
          <div class="col-volume">
            <span class="muted">${formatCompact(market.dayNtlVlm)}</span>
          </div>
          <div class="col-funding">
            <span class="muted">{formatFunding(market.funding)}</span>
          </div>
          <div class="col-oi">
            <span class="muted">${formatCompact(market.openInterest)}</span>
          </div>
          <div class="col-fav">
            <button
              class="fav-btn"
              class:faved={market.isFavorite}
              type="button"
              aria-label={market.isFavorite ? `Remove ${market.symbol} from favorites` : `Add ${market.symbol} to favorites`}
              onclick={() => toggleFavorite(market)}
            >
              {market.isFavorite ? '★' : '☆'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
    margin-top: 1rem;
  }

  .search-label {
    flex: 1 1 240px;
  }

  .sort-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .sort-chip {
    background: transparent;
    border: 1px solid #334155;
    border-radius: 1.25rem;
    padding: 0.3rem 0.7rem;
    font-size: 0.78rem;
    color: #cbd5e1;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .sort-chip:hover {
    background: #1e293b;
    color: #f1f5f9;
  }

  .sort-chip.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }

  .status-message,
  .danger-text {
    margin: 0.85rem 0 0;
    font-size: 0.86rem;
  }

  .danger-text {
    color: #fb7185;
  }

  .table-row {
    grid-template-columns: minmax(0, 1.2fr) minmax(6rem, 0.6fr) minmax(6rem, 0.65fr) minmax(6rem, 0.65fr) minmax(6rem, 0.55fr) minmax(6rem, 0.55fr) 2.5rem;
    align-items: center;
  }

  .col-asset {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    overflow: hidden;
  }

  .col-price,
  .col-change,
  .col-volume,
  .col-funding,
  .col-oi {
    text-align: right;
  }

  .col-change.positive strong {
    color: #22c55e;
  }

  .col-change.negative strong {
    color: #fb7185;
  }

  .col-fav {
    text-align: center;
  }

  .fav-btn {
    background: none;
    border: none;
    font-size: 1.15rem;
    cursor: pointer;
    padding: 0.15rem;
    color: #64748b;
    transition: color 0.15s, transform 0.15s;
    line-height: 1;
  }

  .fav-btn:hover {
    color: #facc15;
    transform: scale(1.2);
  }

  .fav-btn.faved {
    color: #facc15;
  }

  @media (max-width: 760px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .sort-group {
      justify-content: flex-start;
    }

    .table-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .table-row.header-row {
      display: none;
    }

    .col-price,
    .col-change,
    .col-volume,
    .col-funding,
    .col-oi {
      display: none;
    }

    .table-row > .col-asset {
      grid-column: 1;
    }

    .table-row > .col-fav {
      grid-column: 2;
    }

    /* Show a compact price+change summary in asset column on mobile */
    .col-asset::after {
      content: attr(data-summary);
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .col-asset {
      gap: 0.2rem;
    }
  }
</style>
