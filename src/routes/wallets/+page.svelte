<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatAddress, isLikelyHyperliquidAddress } from '$lib/utils/address';

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

  interface SyncResponse {
    results: Array<{
      address: string;
      syncedAt: string;
      snapshotCount: number;
      positionCount: number;
      fillCount: number;
      orderCount: number;
    }>;
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

  let addressInput = '';
  let labelInput = 'My wallet';
  let tagsInput = '';
  let wallets: WalletListItem[] = [];
  let loading = false;
  let saving = false;
  let syncing = false;
  let lastEventAt: string | null = null;
  let eventPolling = false;
  let eventPollAbort: AbortController | null = null;
  let message = 'Add a public Hyperliquid wallet address to start caching snapshots, positions, fills, and orders.';
  let errorMessage = '';

  function statusClass(status: string): string {
    if (status === 'synced') return 'badge success';
    if (status === 'error') return 'badge danger';
    if (status === 'syncing' || status === 'warning') return 'badge warning';
    return 'badge';
  }

  async function loadWallets() {
    if (!browser) return;

    loading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/wallets');
      if (!response.ok) {
        throw new Error('Failed to load tracked wallets');
      }

      const data = (await response.json()) as { wallets: WalletListItem[] };
      wallets = data.wallets;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load wallets';
    } finally {
      loading = false;
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();

    if (!isLikelyHyperliquidAddress(addressInput)) {
      errorMessage = 'Enter a valid 0x Hyperliquid wallet address.';
      return;
    }

    saving = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          address: addressInput.trim(),
          label: labelInput.trim() || undefined,
          tags: tagsInput
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          isActive: true
        })
      });

      const data = (await response.json()) as { wallet?: WalletListItem; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create wallet');
      }

      const createdWallet = data.wallet!;
      const createdAddress = createdWallet.address;

      wallets = [createdWallet, ...wallets.filter((wallet) => wallet.address !== createdAddress)];
      addressInput = '';
      labelInput = 'My wallet';
      tagsInput = '';
      message = `Tracking ${formatAddress(createdAddress)}. Wallet data will be cached after sync.`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to create wallet';
    } finally {
      saving = false;
    }
  }

  async function syncWallet(address: string) {
    syncing = true;
    errorMessage = '';

    try {
      const response = await fetch(`/api/wallets/${address}/sync`, { method: 'POST' });
      const data = (await response.json()) as { result?: unknown; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to sync wallet');
      }

      message = `Synced ${formatAddress(address)}. Latest cache is now available on the wallet detail page.`;
      await loadWallets();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to sync wallet';
    } finally {
      syncing = false;
    }
  }

  async function syncAll() {
    syncing = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/wallets/sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = (await response.json()) as SyncResponse;

      if (!response.ok) {
        throw new Error(data.results ? 'Some wallets failed to sync' : 'Failed to sync wallets');
      }

      message = `Synced ${data.results.length} active wallet${data.results.length === 1 ? '' : 's'}.`;
      await loadWallets();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to sync wallets';
    } finally {
      syncing = false;
    }
  }

  async function deleteWallet(address: string) {
    if (!confirm(`Stop tracking ${formatAddress(address)}?`)) return;

    try {
      const response = await fetch(`/api/wallets/${address}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete wallet');
      }

      wallets = wallets.filter((wallet) => wallet.address !== address);
      message = `Stopped tracking ${formatAddress(address)}.`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete wallet';
    }
  }

  async function pollWalletEvents() {
    if (!browser || eventPolling) return;

    eventPolling = true;

    while (browser && eventPolling) {
      const controller = new AbortController();
      eventPollAbort = controller;

      try {
        const params = new URLSearchParams();
        if (lastEventAt) params.set('lastAt', lastEventAt);
        params.set('timeoutMs', '15000');

        const response = await fetch(`/api/wallets/events?${params.toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Failed to poll wallet events');
        }

        const data = (await response.json()) as { event?: WalletEvent | null };
        const event = data.event;

        if (!event) continue;

        lastEventAt = event.at;

        if (event.type === 'wallet:synced') {
          message = `Live sync event received for ${formatAddress(event.payload.address)}. Wallet cache has been updated.`;
          await loadWallets();
        }

        if (event.type === 'wallet:error') {
          const payload = event.payload;
          errorMessage = `Sync error for ${formatAddress(payload.address)}: ${payload.error}`;
          await loadWallets();
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          break;
        }

        console.warn('[wallets] Event polling failed', error);
      } finally {
        eventPollAbort = null;
      }
    }

    eventPolling = false;
  }

  onMount(() => {
    void loadWallets();
    void pollWalletEvents();

    return () => {
      eventPolling = false;
      eventPollAbort?.abort();
    };
  });
</script>

<section class="hero dashboard-hero">
  <span class="badge">Wallet tracking</span>
  <h1>Track any Hyperliquid wallet in real time.</h1>
  <p>
    Add public wallet addresses, sync them through the Hyperliquid public API, and cache snapshots,
    positions, fills, and orders in your isolated Hyperwallet database.
  </p>
</section>

<section class="grid">
  <article class="card half">
    <h2>Add wallet</h2>
    <form class="stacked-form" on:submit={submit}>
      <label>
        <span>Wallet address</span>
        <input bind:value={addressInput} placeholder="0x..." autocomplete="off" inputmode="text" />
      </label>
      <label>
        <span>Label</span>
        <input bind:value={labelInput} placeholder="Whale, vault, personal wallet..." />
      </label>
      <label>
        <span>Tags, comma separated</span>
        <input bind:value={tagsInput} placeholder="whale, perp, smart-money" />
      </label>
      <div class="actions">
        <button class="button full-width" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Start tracking'}
        </button>
        <button class="button secondary full-width" type="button" on:click={syncAll} disabled={syncing || wallets.length === 0}>
          {syncing ? 'Syncing...' : 'Sync active wallets'}
        </button>
      </div>
    </form>

    {#if errorMessage}
      <p class="muted status-message" role="alert">{errorMessage}</p>
    {:else}
      <p class="muted status-message" role="status">{message}</p>
    {/if}
  </article>

  <article class="card half">
    <div class="section-heading">
      <div>
        <h2>Tracked wallets</h2>
        <span class="small">Cached wallet data is refreshed through the sync API.</span>
        <span class="small">Live events: {eventPolling ? 'connected' : 'paused'}</span>
      </div>
      <button class="button secondary" type="button" on:click={loadWallets} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>

    {#if loading && wallets.length === 0}
      <div class="empty-state">
        <span class="empty-icon">H</span>
        <p>Loading tracked wallets...</p>
      </div>
    {:else if wallets.length === 0}
      <div class="empty-state">
        <span class="empty-icon">0</span>
        <p>No tracked wallets yet. Add a public Hyperliquid address to begin caching live wallet data.</p>
      </div>
    {:else}
      <div class="table-shell" aria-label="Tracked wallets">
        {#each wallets as wallet (wallet.address)}
          <div class="list-item">
            <div>
              <strong>{wallet.label || 'Unnamed wallet'}</strong>
              <a class="muted small" href={`/wallets/${wallet.address}`}>{formatAddress(wallet.address)}</a>
              {#if wallet.tags.length > 0}
                <span class="muted small">{wallet.tags.join(', ')}</span>
              {/if}
              {#if wallet.lastSyncedAt}
                <span class="muted small">Last sync: {new Date(wallet.lastSyncedAt).toLocaleString()}</span>
              {/if}
              {#if wallet.lastError}
                <span class="muted small" role="alert">Error: {wallet.lastError}</span>
              {/if}
            </div>
            <div class="actions">
              <span class={statusClass(wallet.syncStatus)}>{wallet.syncStatus}</span>
              <button class="button secondary" type="button" on:click={() => syncWallet(wallet.address)} disabled={syncing}>
                Sync
              </button>
              <button class="button secondary" type="button" on:click={() => deleteWallet(wallet.address)}>
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </article>
</section>
