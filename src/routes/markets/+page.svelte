<script lang="ts">
  import { onMount } from 'svelte';
  import { formatUsd } from '$lib/hyperliquid/utils';

  interface MarketListItem {
    symbol: string;
    name?: string;
    mid?: number;
    mark?: number;
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
  let loading = false;
  let syncing = false;
  let errorMessage = '';
  let syncMessage = '';
  let searchTimeout: number | undefined;

  function formatCompact(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatFunding(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return `${(value * 100).toFixed(4)}%`;
  }

  function formatTime(value: string | undefined): string {
    if (!value) return 'Never';

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function scheduleLoad() {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => void loadMarkets(), 250);
  }

  async function loadMarkets() {
    loading = true;
    errorMessage = '';

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/markets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load markets');
      }

      const data = (await response.json()) as { markets: MarketListItem[] };
      markets = data.markets;
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
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ force })
      });
      const data = (await response.json()) as { result?: SyncMarketsResult; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to sync markets');
      }

      syncMessage = `Synced ${data.result?.marketCount ?? 0} market(s) from Hyperliquid.`;
      await loadMarkets();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to sync markets';
    } finally {
      syncing = false;
    }
  }

  onMount(() => {
    void loadMarkets();
    return () => window.clearTimeout(searchTimeout);
  });
</script>

<svelte:head>
  <title>Markets · Hyperwallet</title>
</svelte:head>

<section class="hero">
  <span class="badge">Market scanner</span>
  <h1>Live Hyperliquid market overview.</h1>
  <p>
    Sync Hyperliquid universe metadata with asset context, then browse cached perp markets by
    mid price, 24h volume, funding, and open interest.
  </p>
  <div class="actions compact-actions">
    <button class="button" type="button" on:click={() => syncMarkets(true)} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync markets'}
    </button>
    <button class="button secondary" type="button" on:click={loadMarkets} disabled={loading}>
      {loading ? 'Loading...' : 'Refresh cache'}
    </button>
  </div>
</section>

<section class="card">
  <div class="section-heading">
    <div>
      <h2>Markets</h2>
      <p class="muted small">Search cached market rows and compare 24h volume, funding, and open interest.</p>
    </div>
    <span class="badge">{markets.length}</span>
  </div>

  <label class="search-label">
    <span>Search symbol</span>
    <input bind:value={search} on:input={scheduleLoad} placeholder="BTC, ETH, SOL..." autocomplete="off" />
  </label>

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
        <div>
          <strong>Asset</strong>
          <span class="muted small">Symbol and context</span>
        </div>
        <span class="badge">Mid</span>
        <span class="badge">24h</span>
        <span class="badge">Funding</span>
        <span class="badge">OI</span>
      </div>
      {#each markets as market (market.symbol)}
        <div class="table-row">
          <div>
            <strong>{market.name || market.symbol}</strong>
            <span class="muted small">{market.symbol} · {market.category || 'perp'} · updated {formatTime(market.timestamp)}</span>
          </div>
          <strong>{formatUsd(market.mid)}</strong>
          <span class="muted">${formatCompact(market.dayNtlVlm)}</span>
          <span class="muted">{formatFunding(market.funding)}</span>
          <span class="muted">${formatCompact(market.openInterest)}</span>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .search-label {
    margin-top: 1rem;
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
    grid-template-columns: minmax(0, 1.45fr) minmax(7rem, 0.55fr) minmax(6rem, 0.55fr) minmax(6rem, 0.55fr) minmax(6rem, 0.55fr);
  }

  @media (max-width: 760px) {
    .table-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .table-row.header-row {
      display: none;
    }

    .table-row > span:nth-last-child(-n + 4) {
      display: none;
    }

    .table-row > div span {
      display: block;
    }
  }
</style>
