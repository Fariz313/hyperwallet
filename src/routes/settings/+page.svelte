<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let pushSupported = false;
  let pushSubscribed = false;
  let vapidAvailable = false;
  let checkingPush = true;

  async function checkPushStatus() {
    if (!browser || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      pushSupported = false;
      checkingPush = false;
      return;
    }

    pushSupported = true;

    // Check if VAPID is configured on server
    try {
      const vapidResponse = await fetch('/api/notifications/vapid-key');
      vapidAvailable = vapidResponse.ok;
    } catch {
      vapidAvailable = false;
    }

    // Check if already subscribed
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      pushSubscribed = subscription !== null;
    } catch {
      pushSubscribed = false;
    }

    checkingPush = false;
  }

  async function subscribeToPush() {
    if (!browser || !pushSupported || !vapidAvailable) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const vapidResponse = await fetch('/api/notifications/vapid-key');
      const vapidData = await vapidResponse.json() as { publicKey: string };

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.publicKey,
      });

      const subResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      pushSubscribed = subResponse.ok;
    } catch (error) {
      console.warn('[settings] Push subscription failed:', error);
    }
  }

  async function unsubscribeFromPush() {
    if (!browser || !pushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
      }
      pushSubscribed = false;
    } catch (error) {
      console.warn('[settings] Unsubscribe failed:', error);
    }
  }

  onMount(() => {
    void checkPushStatus();
  });
</script>

<svelte:head>
  <title>Settings · Hyperwallet</title>
</svelte:head>

<section class="hero">
  <span class="badge success">Phase 6 · Alerts & Notifications</span>
  <h1>Preferences and privacy.</h1>
  <p>Manage notification preferences, theme, and refresh settings.</p>
</section>

<section class="grid settings-grid">
  <article class="card">
    <div class="card-icon">🔔</div>
    <h2>Push notifications</h2>
    {#if checkingPush}
      <p class="muted small">Checking push capability...</p>
    {:else if !pushSupported}
      <p class="muted small">Push notifications are not supported in this browser.</p>
    {:else if !vapidAvailable}
      <p class="muted small">Push server not configured (VAPID keys missing).</p>
      <p class="muted small">Set <code>VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code> in <code>.env</code>.</p>
    {:else if pushSubscribed}
      <p class="muted small">Push notifications are enabled and subscribed.</p>
      <button class="button secondary" type="button" onclick={unsubscribeFromPush}>Unsubscribe</button>
    {:else}
      <p class="muted small">Enable push notifications to receive alerts even when the browser is closed.</p>
      <button class="button" type="button" onclick={subscribeToPush}>Enable push</button>
    {/if}
  </article>

  <article class="card">
    <div class="card-icon">↗</div>
    <h2>Price alerts</h2>
    <p>Configure price alerts above or below target prices for any market.</p>
    <a class="button secondary" href="/alerts">Manage alerts</a>
  </article>

  <article class="card">
    <div class="card-icon">●</div>
    <h2>Wallet activity alerts</h2>
    <p>Monitor tracked wallets for new positions, fills, or liquidation risk.</p>
    <a class="button secondary" href="/alerts">Manage alerts</a>
  </article>

  <article class="card">
    <div class="card-icon">✦</div>
    <h2>Notification history</h2>
    <p>View past alert notifications, price triggers, and system messages.</p>
    <a class="button secondary" href="/notifications">View history</a>
  </article>

  <article class="card">
    <div class="card-icon">↻</div>
    <h2>Sync settings</h2>
    <p>Wallet sync runs every 30s. Alert evaluation runs every 60s. Markets refresh on page load.</p>
  </article>

  <article class="card">
    <div class="card-icon">🔒</div>
    <h2>Privacy</h2>
    <p>Hyperwallet is designed as read-only wallet analytics. It never requests private keys.</p>
  </article>
</section>

<style>
  .settings-grid {
    grid-template-columns: 1fr;
  }

  @media (min-width: 600px) {
    .settings-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 960px) {
    .settings-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
