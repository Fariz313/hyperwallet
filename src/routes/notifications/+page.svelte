<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  interface NotificationItem {
    _id: string;
    title: string;
    body: string;
    type: string;
    url?: string;
    isRead: boolean;
    createdAt: string;
  }

  let notifications: NotificationItem[] = [];
  let unreadCount = 0;
  let loading = false;
  let errorMessage = '';
  let pushSupported = false;
  let pushSubscribed = false;

  function formatRelativeTime(value: string | undefined): string {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  async function loadNotifications() {
    if (!browser) return;
    loading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/notifications?limit=100');
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = await response.json() as { notifications: NotificationItem[]; unreadCount: number };
      notifications = data.notifications;
      unreadCount = data.unreadCount;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
    } finally {
      loading = false;
    }
  }

  async function markAllRead() {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      await loadNotifications();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to mark notifications as read';
    }
  }

  async function subscribeToPush() {
    if (!browser || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      pushSupported = false;
      return;
    }

    pushSupported = true;

    try {
      // Check if already subscribed
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        pushSubscribed = true;

        // On page load, sync with server if not already
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existingSubscription.toJSON()),
        });
        return;
      }

      // Get VAPID public key from server
      const vapidResponse = await fetch('/api/notifications/vapid-key');
      if (!vapidResponse.ok) {
        pushSubscribed = false;
        return;
      }
      const vapidData = await vapidResponse.json() as { publicKey: string };

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        pushSubscribed = false;
        return;
      }

      // Create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.publicKey,
      });

      // Save subscription to server
      const subResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (subResponse.ok) {
        pushSubscribed = true;
      }
    } catch (error) {
      console.warn('[notifications] Push subscription failed:', error);
      pushSubscribed = false;
    }
  }

  async function unsubscribeFromPush() {
    if (!browser || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();

        // Notify server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existingSubscription.endpoint }),
        });
      }
      pushSubscribed = false;
    } catch (error) {
      console.warn('[notifications] Unsubscribe failed:', error);
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'price_alert': return '↗';
      case 'wallet_activity': return '●';
      case 'system': return '⚙';
      default: return '✦';
    }
  }

  onMount(() => {
    void loadNotifications();
    void subscribeToPush();
  });
</script>

<svelte:head>
  <title>Notifications · Hyperwallet</title>
</svelte:head>

<section class="hero">
  <span class="badge success">Notifications</span>
  <h1>Notification center.</h1>
  <p>View past notifications and manage push subscription.</p>
  {#if errorMessage}
    <p class="muted" role="alert">{errorMessage}</p>
  {/if}
</section>

<!-- Push Subscription Status -->
<section class="metric-grid">
  <article class="metric-card">
    <span class="metric-label">Push notifications</span>
    <strong class={pushSubscribed ? 'success-text' : 'muted-text'}>
      {pushSubscribed ? 'Enabled' : 'Disabled'}
    </strong>
    {#if pushSubscribed}
      <button class="button secondary small" type="button" onclick={unsubscribeFromPush}>Unsubscribe</button>
    {:else if pushSupported}
      <button class="button secondary small" type="button" onclick={subscribeToPush}>Enable push</button>
    {:else}
      <p class="muted small">Push not supported in this browser</p>
    {/if}
  </article>
  <article class="metric-card">
    <span class="metric-label">Unread</span>
    <strong>{unreadCount}</strong>
  </article>
  <article class="metric-card">
    <span class="metric-label">Total</span>
    <strong>{notifications.length}</strong>
  </article>
  <article class="metric-card wide-metric">
    <div class="actions compact-actions" style="justify-content: flex-end;">
      {#if unreadCount > 0}
        <button class="button secondary" type="button" onclick={markAllRead}>Mark all read</button>
      {/if}
      <button class="button secondary" type="button" onclick={loadNotifications} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  </article>
</section>

<!-- Notification Inbox -->
<section class="card">
  <div class="section-heading">
    <div>
      <h2>Inbox</h2>
      <p class="muted small">Alert, wallet, and system notifications.</p>
    </div>
  </div>

  {#if loading && notifications.length === 0}
    <div class="empty-state">
      <p>Loading notifications...</p>
    </div>
  {:else if notifications.length === 0}
    <div class="empty-state">
      <div class="empty-icon">✦</div>
      <strong>No notifications yet.</strong>
      <p>Alerts, price triggers, and system messages will appear here.</p>
    </div>
  {:else}
    <div class="table-shell">
      {#each notifications as notification (notification._id)}
        <div class="list-item" class:unread={!notification.isRead}>
          <div>
            <div class="notification-title">
              <span class="notification-icon">{getTypeIcon(notification.type)}</span>
              <strong>{notification.title}</strong>
              {#if !notification.isRead}
                <span class="badge" style="font-size: 0.65rem;">New</span>
              {/if}
            </div>
            <p class="muted small">{notification.body}</p>
            <span class="notification-type muted small">{notification.type.replace('_', ' ')} · {formatRelativeTime(notification.createdAt)}</span>
          </div>
          {#if notification.url}
            <a class="button secondary small" href={notification.url}>View</a>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .notification-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .notification-icon {
    font-size: 1rem;
    width: 1.5rem;
    text-align: center;
  }

  .notification-type {
    display: block;
    margin-top: 0.2rem;
  }

  .unread {
    background: rgba(99, 102, 241, 0.05);
    border-left: 2px solid #6366f1;
    padding-left: 0.75rem;
  }

  .success-text {
    color: #22c55e;
  }

  .muted-text {
    color: #94a3b8;
  }

  .small {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    .list-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .list-item > a {
      justify-self: start;
    }
  }
</style>
