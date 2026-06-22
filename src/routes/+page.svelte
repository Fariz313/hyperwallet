<section class="hero dashboard-hero">
  <span class="badge success">Phase 1 skeleton</span>
  <h1>Real-time Hyperliquid wallet tracking, without private keys.</h1>
  <p>
    Hyperwallet is a standalone SvelteKit SSR PWA for tracking public Hyperliquid wallets,
    markets, alerts, leaderboard activity, and notifications. This folder is intentionally
    isolated from the main app and will connect to shared DB/API only after the contract is approved.
  </p>
  <div class="actions">
    <a class="button" href="/wallets">Start tracking wallets</a>
    <a class="button secondary" href="/markets">Open market scanner</a>
  </div>
</section>

<section class="grid" aria-label="Phase 1 progress">
  <article class="card third">
    <div class="metric-value">SSR</div>
    <h2>SSR PWA shell</h2>
    <p>SvelteKit layout, SSR-enabled routes, responsive navigation, and installable PWA manifest.</p>
  </article>
  <article class="card third">
    <div class="metric-value">0x</div>
    <h2>Read-only scope</h2>
    <p>Wallet tracking is designed around public addresses only. No private keys, signing, or custody.</p>
  </article>
  <article class="card third">
    <div class="metric-value">API</div>
    <h2>API boundary ready</h2>
    <p>Phase 1 includes a health endpoint. Wallet, market, alert, and realtime APIs are planned for later phases.</p>
  </article>
  <article class="card half">
    <div class="metric-value">Phase 2</div>
    <h2>Next phase</h2>
    <p>Phase 2 will add Mongo connection, models, indexes, and collection naming for isolated or shared DB mode.</p>
  </article>
  <article class="card half">
    <div class="metric-value">Isolated</div>
    <h2>Main app status</h2>
    <p>The parent app remains untouched. The parent repository excludes this nested project folder.</p>
  </article>
</section>
