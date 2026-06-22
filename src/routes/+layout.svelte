<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import '../app.css';
  import { registerServiceWorker } from '$lib/pwa/registerServiceWorker';

  onMount(() => {
    if (!browser) return;

    registerServiceWorker();
    setupInstallAlert();
  });

  const nav = [
    { href: '/', label: 'Dashboard' },
    { href: '/wallets', label: 'Wallets' },
    { href: '/markets', label: 'Markets' },
    { href: '/alerts', label: 'Alerts' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/settings', label: 'Settings' }
  ];

  let navOpen = false;
  let deferredPrompt: any = null;
  let showInstallAlert = false;
  let iosInstallFallback = false;

  function isIosDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  function isInstalledApp() {
    const standalone = Boolean((window.navigator as any).standalone);
    return standalone || window.matchMedia('(display-mode: standalone)').matches;
  }

  function setupInstallAlert() {
    if (isInstalledApp()) {
      showInstallAlert = false;
      iosInstallFallback = false;
      return;
    }

    if (isIosDevice()) {
      iosInstallFallback = true;
      showInstallAlert = true;
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      deferredPrompt = event;
      showInstallAlert = true;
    });
  }

  async function installApp() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    showInstallAlert = false;
  }

  function dismissInstallAlert() {
    deferredPrompt = null;
    iosInstallFallback = false;
    showInstallAlert = false;
  }

  function toggleNav() {
    navOpen = !navOpen;
  }

  function closeNav() {
    navOpen = false;
  }
</script>

<svelte:head>
  <title>Hyperwallet</title>
</svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="Hyperwallet dashboard">
      <span class="brand-mark" aria-hidden="true">H</span>
      <span class="brand-text">
        <strong>Hyperwallet</strong>
        <small>Read-only Hyperliquid tracker</small>
      </span>
    </a>

    <button class:open={navOpen} class="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={navOpen} on:click={toggleNav}>
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav class:open={navOpen} class="nav" aria-label="Primary navigation">
      {#each nav as item}
        <a
          class:active={$page.url.pathname === item.href || $page.url.pathname.startsWith(`${item.href}/`)}
          href={item.href}
          on:click={closeNav}
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </header>

  {#if showInstallAlert}
    <section class="install-alert" role="status" aria-live="polite">
      <div class="install-alert-copy">
        <strong>{iosInstallFallback ? 'Install Hyperwallet on your Home Screen' : 'Install Hyperwallet'}</strong>
        <p>
          {iosInstallFallback
            ? 'Open Safari, tap the Share button, then choose Add to Home Screen.'
            : 'Install this PWA for faster read-only wallet tracking access from your Home Screen.'}
        </p>
      </div>

      <div class="install-alert-actions">
        <button class="button secondary" type="button" on:click={dismissInstallAlert}>
          {iosInstallFallback ? 'Dismiss' : 'Later'}
        </button>
        {#if deferredPrompt}
          <button class="button" type="button" on:click={installApp}>
            Install
          </button>
        {/if}
      </div>
    </section>
  {/if}

  <div class:nav-overlay={navOpen} on:click={closeNav} aria-hidden={!navOpen}></div>

  <main class="content">
    <slot />
  </main>

  <footer class="footer">
    Hyperwallet Phase 1 skeleton · SSR PWA · no private keys
  </footer>
</div>

