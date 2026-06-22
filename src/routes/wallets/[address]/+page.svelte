<script lang="ts">
  import { browser } from '$app/environment';
  import { formatAddress } from '$lib/utils/address';

  interface WalletDetailData {
    address: string;
    label?: string;
    tags: string[];
    isActive: boolean;
    syncStatus: string;
    lastSyncedAt?: string;
    lastError?: string;
    latestSnapshot?: {
      accountValue: number;
      totalMarginUsed: number;
      totalPositionSzi: number;
      openPositionCount: number;
      liquidationRisk?: number;
      timestamp: string;
    };
    positions: Array<{
      coin: string;
      szi: number;
      side: string;
      entryPx?: number;
      markPx?: number;
      unrealizedPnl?: number;
      leverage?: number;
      liquidationPx?: number;
      updatedAt: string;
    }>;
    recentFills: Array<{
      coin: string;
      side: string;
      size: number;
      price: number;
      hash: string;
      time: string;
      closedPnl?: number;
    }>;
    recentOrders: Array<{
      coin: string;
      side: string;
      size: number;
      limitPx?: number;
      triggerPx?: number;
      orderType: string;
      status: string;
      timestamp: string;
    }>;
  }

  export let data: {
    wallet: WalletDetailData;
  };

  let syncing = false;
  let syncMessage = '';
  let syncError = '';

  function formatNumber(value: number | undefined, decimals = 2): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0
    }).format(value);
  }

  function formatUsd(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatPct(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatRelativeTime(value: string | undefined): string {
    if (!value) return 'Not synced yet';

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function sideClass(side: string): string {
    const normalized = side.toLowerCase();

    if (normalized.includes('long') || normalized === 'b') return 'long-text';
    if (normalized.includes('short') || normalized === 'a') return 'short-text';
    return '';
  }

  function statusClass(status: string): string {
    if (status === 'synced') return 'badge success';
    if (status === 'error') return 'badge danger';
    if (status === 'syncing' || status === 'warning') return 'badge warning';
    return 'badge';
  }

  function pnl(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value);
  }

  async function syncWallet() {
    if (!browser) return;

    syncing = true;
    syncError = '';
    syncMessage = '';

    try {
      const response = await fetch(`/api/wallets/${data.wallet.address}/sync`, {
        method: 'POST'
      });
      const result = (await response.json()) as { result?: unknown; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to sync wallet');
      }

      syncMessage = 'Wallet sync completed. Refresh the page to see the latest cache.';
    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Failed to sync wallet';
    } finally {
      syncing = false;
    }
  }
</script>

<svelte:head>
  <title>{data.wallet.label || 'Wallet detail'} · {formatAddress(data.wallet.address)} · Hyperwallet</title>
</svelte:head>

<section class="hero wallet-hero">
  <span class={statusClass(data.wallet.syncStatus)}>Status: {data.wallet.syncStatus}</span>
  <h1>{data.wallet.label || 'Unnamed wallet'}</h1>
  <p class="muted">{formatAddress(data.wallet.address)}</p>
  <div class="tag-row">
    {#each data.wallet.tags as tag}
      <span class="badge">{tag}</span>
    {/each}
    {#if data.wallet.tags.length === 0}
      <span class="badge">wallet</span>
    {/if}
  </div>
  <p class="muted">Last sync: {formatRelativeTime(data.wallet.lastSyncedAt)}</p>
  {#if data.wallet.lastError}
    <p class="muted danger-text" role="alert">Last error: {data.wallet.lastError}</p>
  {/if}
  <div class="actions compact-actions">
    <a class="button secondary" href="/wallets">Back to wallets</a>
    <button class="button" type="button" on:click={syncWallet} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync wallet'}
    </button>
  </div>
  {#if syncMessage}
    <p class="muted status-message" role="status">{syncMessage}</p>
  {/if}
  {#if syncError}
    <p class="muted danger-text" role="alert">{syncError}</p>
  {/if}
</section>

<section class="metric-grid" aria-label="Wallet account summary">
  <article class="metric-card">
    <span class="metric-label">Account value</span>
    <strong>{formatUsd(data.wallet.latestSnapshot?.accountValue)}</strong>
    <p>Latest cached snapshot value.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Margin used</span>
    <strong>{formatUsd(data.wallet.latestSnapshot?.totalMarginUsed)}</strong>
    <p>Current total margin used in the cached clearinghouse state.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Open positions</span>
    <strong>{formatNumber(data.wallet.latestSnapshot?.openPositionCount, 0)}</strong>
    <p>Positions cached from the latest wallet state.</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Position Szi</span>
    <strong>{formatNumber(data.wallet.latestSnapshot?.totalPositionSzi)}</strong>
    <p>Total signed position size across open assets.</p>
  </article>
  <article class="metric-card wide-metric">
    <span class="metric-label">Margin risk</span>
    <strong>{formatPct(data.wallet.latestSnapshot?.liquidationRisk)}</strong>
    <p>Approximate margin used divided by account value from the latest snapshot.</p>
  </article>
</section>

<section class="grid">
  <article class="card">
    <div class="section-heading">
      <div>
        <h2>Open positions</h2>
        <span class="small">Cached current positions for {formatAddress(data.wallet.address)}.</span>
      </div>
      <span class="badge">{data.wallet.positions.length}</span>
    </div>

    {#if data.wallet.positions.length === 0}
      <div class="empty-state compact-empty">
        <span class="empty-icon">0</span>
        <p>No open positions are cached yet.</p>
      </div>
    {:else}
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Side</th>
              <th>Size</th>
              <th>Entry</th>
              <th>Mark</th>
              <th>PnL</th>
              <th>Liq</th>
            </tr>
          </thead>
          <tbody>
            {#each data.wallet.positions as position (position.coin)}
              <tr>
                <td><strong>{position.coin}</strong></td>
                <td class={sideClass(position.side)}>{position.side}</td>
                <td>{formatNumber(position.szi)}</td>
                <td>{formatUsd(position.entryPx)}</td>
                <td>{formatUsd(position.markPx)}</td>
                <td>{pnl(position.unrealizedPnl)}</td>
                <td>{formatUsd(position.liquidationPx)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </article>

  <article class="card">
    <div class="section-heading">
      <div>
        <h2>Recent fills</h2>
        <span class="small">Latest cached trade executions synced from Hyperliquid.</span>
      </div>
      <span class="badge">{data.wallet.recentFills.length}</span>
    </div>

    {#if data.wallet.recentFills.length === 0}
      <div class="empty-state compact-empty">
        <span class="empty-icon">0</span>
        <p>No recent fills are cached yet.</p>
      </div>
    {:else}
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Asset</th>
              <th>Side</th>
              <th>Size</th>
              <th>Price</th>
              <th>PnL</th>
            </tr>
          </thead>
          <tbody>
            {#each data.wallet.recentFills as fill (fill.hash)}
              <tr>
                <td>
                  <strong>{new Date(fill.time).toLocaleString()}</strong>
                  <span class="muted small">{formatAddress(fill.hash)}</span>
                </td>
                <td>{fill.coin}</td>
                <td class={sideClass(fill.side)}>{fill.side}</td>
                <td>{formatNumber(fill.size)}</td>
                <td>{formatUsd(fill.price)}</td>
                <td>{pnl(fill.closedPnl)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </article>

  <article class="card full-width-card">
    <div class="section-heading">
      <div>
        <h2>Recent orders</h2>
        <span class="small">Latest cached order records by timestamp.</span>
      </div>
      <span class="badge">{data.wallet.recentOrders.length}</span>
    </div>

    {#if data.wallet.recentOrders.length === 0}
      <div class="empty-state compact-empty">
        <span class="empty-icon">0</span>
        <p>No recent orders are cached yet.</p>
      </div>
    {:else}
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Asset</th>
              <th>Side</th>
              <th>Size</th>
              <th>Limit</th>
              <th>Trigger</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each data.wallet.recentOrders as order (order.timestamp)}
              <tr>
                <td>{new Date(order.timestamp).toLocaleString()}</td>
                <td><strong>{order.coin}</strong></td>
                <td class={sideClass(order.side)}>{order.side}</td>
                <td>{formatNumber(order.size)}</td>
                <td>{formatUsd(order.limitPx)}</td>
                <td>{formatUsd(order.triggerPx)}</td>
                <td>{order.orderType}</td>
                <td><span class="badge">{order.status}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </article>
</section>

<style>
  .status-message {
    margin: 0.75rem 0 0;
  }

  .danger-text {
    color: #fb7185;
  }

  .long-text {
    color: #22c55e;
  }

  .short-text {
    color: #fb7185;
  }
</style>
