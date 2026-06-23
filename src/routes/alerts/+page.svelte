<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  interface PriceAlert {
    _id: string;
    symbol: string;
    condition: 'above' | 'below';
    price: number;
    isActive: boolean;
    lastTriggeredAt?: string;
    createdAt: string;
  }

  interface WalletActivityAlert {
    _id: string;
    wallet: string;
    alertType: string;
    coin?: string;
    side?: 'A' | 'B';
    threshold?: number;
    isActive: boolean;
    lastTriggeredAt?: string;
    createdAt: string;
  }

  let priceAlerts: PriceAlert[] = [];
  let walletAlerts: WalletActivityAlert[] = [];
  let loading = false;
  let errorMessage = '';

  // New price alert form
  let showPriceForm = false;
  let newSymbol = '';
  let newCondition: 'above' | 'below' = 'above';
  let newPrice = '';
  let priceFormSaving = false;

  // New wallet activity alert form
  let showActivityForm = false;
  let newWallet = '';
  let newAlertType = 'new_position';
  let newCoin = '';
  let newThreshold = '';
  let activityFormSaving = false;

  function formatRelativeTime(value: string | undefined): string {
    if (!value) return 'Never';
    const diff = Date.now() - new Date(value).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  function shortAddress(address: string): string {
    return address.length > 12 ? `${address.slice(0, 8)}...${address.slice(-4)}` : address;
  }

  async function loadAlerts() {
    if (!browser) return;
    loading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to load alerts');
      const data = await response.json() as { priceAlerts: PriceAlert[]; walletAlerts: WalletActivityAlert[] };
      priceAlerts = data.priceAlerts;
      walletAlerts = data.walletAlerts;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load alerts';
    } finally {
      loading = false;
    }
  }

  async function toggleAlert(id: string, isActive: boolean, type: 'price' | 'activity') {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive, type }),
      });
      if (!response.ok) throw new Error('Failed to toggle alert');
      await loadAlerts();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to toggle alert';
    }
  }

  async function deleteAlert(id: string, type: 'price' | 'activity') {
    if (!confirm('Delete this alert?')) return;
    try {
      const response = await fetch(`/api/alerts/${id}?type=${type}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete alert');
      await loadAlerts();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete alert';
    }
  }

  async function createPriceAlert() {
    if (!newSymbol || !newPrice) return;
    priceFormSaving = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/alerts/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim(),
          condition: newCondition,
          price: Number(newPrice),
        }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create price alert');
      }
      newSymbol = '';
      newPrice = '';
      showPriceForm = false;
      await loadAlerts();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to create price alert';
    } finally {
      priceFormSaving = false;
    }
  }

  async function createWalletActivityAlert() {
    if (!newWallet) return;
    activityFormSaving = true;
    errorMessage = '';

    try {
      const body: Record<string, unknown> = {
        wallet: newWallet.trim(),
        alertType: newAlertType,
      };
      if (newCoin) body.coin = newCoin.trim();
      if (newThreshold) body.threshold = Number(newThreshold);

      const response = await fetch('/api/alerts/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create wallet activity alert');
      }
      newWallet = '';
      newCoin = '';
      newThreshold = '';
      showActivityForm = false;
      await loadAlerts();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to create wallet activity alert';
    } finally {
      activityFormSaving = false;
    }
  }

  onMount(() => {
    void loadAlerts();
  });
</script>

<svelte:head>
  <title>Alerts · Hyperwallet</title>
</svelte:head>

<section class="hero">
  <span class="badge success">Phase 6 · Alerts & Notifications</span>
  <h1>Price and wallet activity alerts.</h1>
  <p>Create alerts for price movements or wallet activity. Triggered alerts send PWA push notifications.</p>
  {#if errorMessage}
    <p class="muted" role="alert">{errorMessage}</p>
  {/if}
</section>

<section class="metric-grid">
  <article class="metric-card">
    <span class="metric-label">Price alerts</span>
    <strong>{priceAlerts.length}</strong>
    <p>Active: {priceAlerts.filter(a => a.isActive).length}</p>
  </article>
  <article class="metric-card">
    <span class="metric-label">Wallet alerts</span>
    <strong>{walletAlerts.length}</strong>
    <p>Active: {walletAlerts.filter(a => a.isActive).length}</p>
  </article>
  <article class="metric-card wide-metric">
    <div class="actions compact-actions">
      <button class="button secondary" type="button" onclick={() => { showPriceForm = !showPriceForm; showActivityForm = false; }}>
        {showPriceForm ? 'Cancel' : '+ Price alert'}
      </button>
      <button class="button secondary" type="button" onclick={() => { showActivityForm = !showActivityForm; showPriceForm = false; }}>
        {showActivityForm ? 'Cancel' : '+ Wallet alert'}
      </button>
      <button class="button secondary" type="button" onclick={loadAlerts} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  </article>
</section>

<!-- New Price Alert Form -->
{#if showPriceForm}
  <section class="card">
    <form onsubmit={(e) => { e.preventDefault(); void createPriceAlert(); }}>
      <div class="section-heading">
        <h2>New price alert</h2>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="symbol">Symbol</label>
          <input id="symbol" type="text" placeholder="ETH-PERP" bind:value={newSymbol} required />
        </div>
        <div class="field">
          <label for="condition">Condition</label>
          <select id="condition" bind:value={newCondition}>
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
        </div>
        <div class="field">
          <label for="price">Price ($)</label>
          <input id="price" type="number" step="0.01" min="0" placeholder="3500" bind:value={newPrice} required />
        </div>
        <div class="field submit-field">
          <button class="button" type="submit" disabled={priceFormSaving}>
            {priceFormSaving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  </section>
{/if}

<!-- New Wallet Activity Alert Form -->
{#if showActivityForm}
  <section class="card">
    <form onsubmit={(e) => { e.preventDefault(); void createWalletActivityAlert(); }}>
      <div class="section-heading">
        <h2>New wallet activity alert</h2>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="wallet">Wallet address</label>
          <input id="wallet" type="text" placeholder="0x..." bind:value={newWallet} required />
        </div>
        <div class="field">
          <label for="alertType">Alert type</label>
          <select id="alertType" bind:value={newAlertType}>
            <option value="new_position">New position</option>
            <option value="fill_size">Fill threshold</option>
            <option value="liquidation">Liquidation risk</option>
          </select>
        </div>
        <div class="field">
          <label for="walletCoin">Coin (optional)</label>
          <input id="walletCoin" type="text" placeholder="ETH-PERP" bind:value={newCoin} />
        </div>
        <div class="field">
          <label for="walletThreshold">Threshold (optional)</label>
          <input id="walletThreshold" type="number" min="0" placeholder="3" bind:value={newThreshold} />
        </div>
        <div class="field submit-field">
          <button class="button" type="submit" disabled={activityFormSaving}>
            {activityFormSaving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  </section>
{/if}

<!-- Price Alerts List -->
<section class="grid">
  <article class="card full-width-card">
    <div class="section-heading">
      <h2>Price alerts ({priceAlerts.length})</h2>
      <span class="small">Notifies when a market crosses the set price.</span>
    </div>

    {#if loading && priceAlerts.length === 0}
      <div class="empty-state">
        <p>Loading price alerts...</p>
      </div>
    {:else if priceAlerts.length === 0}
      <div class="empty-state">
        <span class="empty-icon">↗</span>
        <h3>No price alerts</h3>
        <p>Create a price alert to get notified when a market moves above or below a target price.</p>
      </div>
    {:else}
      <div class="table-shell">
        {#each priceAlerts as alert (alert._id)}
          <div class="list-item">
            <div>
              <strong>{alert.symbol}</strong>
              <span class="muted small">
                {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.price.toLocaleString()}
              </span>
              {#if alert.lastTriggeredAt}
                <span class="muted small">Triggered {formatRelativeTime(alert.lastTriggeredAt)}</span>
              {:else}
                <span class="muted small">Created {formatRelativeTime(alert.createdAt)}</span>
              {/if}
            </div>
            <div class="actions">
              <button
                class="button secondary small"
                type="button"
                onclick={() => void toggleAlert(alert._id, !alert.isActive, 'price')}
              >
                {alert.isActive ? 'Active' : 'Paused'}
              </button>
              <button
                class="button secondary small danger-hover"
                type="button"
                onclick={() => void deleteAlert(alert._id, 'price')}
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </article>
</section>

<!-- Wallet Activity Alerts List -->
<section class="grid">
  <article class="card full-width-card">
    <div class="section-heading">
      <h2>Wallet activity alerts ({walletAlerts.length})</h2>
      <span class="small">Notifies when a tracked wallet performs certain actions.</span>
    </div>

    {#if loading && walletAlerts.length === 0}
      <div class="empty-state">
        <p>Loading wallet activity alerts...</p>
      </div>
    {:else if walletAlerts.length === 0}
      <div class="empty-state">
        <span class="empty-icon">●</span>
        <h3>No wallet activity alerts</h3>
        <p>Create a wallet activity alert to get notified when a tracked wallet opens positions, hits fill thresholds, or faces liquidation risk.</p>
      </div>
    {:else}
      <div class="table-shell">
        {#each walletAlerts as alert (alert._id)}
          <div class="list-item">
            <div>
              <strong>{alert.alertType === 'new_position' ? 'New position' : alert.alertType === 'fill_size' ? 'Fill threshold' : alert.alertType === 'liquidation' ? 'Liquidation risk' : alert.alertType}</strong>
              <span class="muted small">{shortAddress(alert.wallet)}{#if alert.coin} · {alert.coin}{/if}</span>
              {#if alert.lastTriggeredAt}
                <span class="muted small">Triggered {formatRelativeTime(alert.lastTriggeredAt)}</span>
              {:else}
                <span class="muted small">Created {formatRelativeTime(alert.createdAt)}</span>
              {/if}
            </div>
            <div class="actions">
              <button
                class="button secondary small"
                type="button"
                onclick={() => void toggleAlert(alert._id, !alert.isActive, 'activity')}
              >
                {alert.isActive ? 'Active' : 'Paused'}
              </button>
              <button
                class="button secondary small danger-hover"
                type="button"
                onclick={() => void deleteAlert(alert._id, 'activity')}
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </article>
</section>

<style>
  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (min-width: 500px) {
    .form-row {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      align-items: end;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .field.submit-field {
    justify-content: flex-end;
  }

  @media (min-width: 500px) {
    .field.submit-field {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .field.submit-field .button {
      align-self: flex-end;
    }
  }

  .field label {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .field input,
  .field select {
    padding: 0.45rem 0.6rem;
    border: 1px solid #334155;
    border-radius: 6px;
    background: #1e293b;
    color: #f1f5f9;
    font-size: 0.9rem;
  }

  .field input:focus,
  .field select:focus {
    outline: none;
    border-color: #6366f1;
  }

  .danger-hover:hover {
    color: #fb7185;
  }

  .small {
    font-size: 0.8rem;
  }
</style>
