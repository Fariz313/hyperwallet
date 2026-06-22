<section class="hero">
  <span class="badge">Alerts</span>
  <h1>Price and wallet activity alerts.</h1>
  <p>Phase 1 creates the alerts page shell. Phase 6 will add alert CRUD, evaluation, and PWA push notifications.</p>
</section>

<section class="grid">
  <article class="card half">
    <div class="card-icon">↗</div>
    <h2>Price alerts</h2>
    <p>Conditions such as ETH-PERP above $3,500, BTC-PERP below $65,000, or percentage-change triggers.</p>
  </article>
  <article class="card half">
    <div class="card-icon">●</div>
    <h2>Wallet activity alerts</h2>
    <p>Notify when followed wallets open, close, liquidate, or trigger risk thresholds.</p>
  </article>
  <article class="card wide">
    <div class="section-heading">
      <div>
        <h2>Alert inbox preview</h2>
        <p class="muted small">Future alerts will render as responsive rows with wallet, market, trigger, and timestamp.</p>
      </div>
      <span class="badge warning">Phase 6</span>
    </div>
    <div class="table-shell" aria-label="Alert examples">
      <div class="table-row header-row">
        <div>
          <strong>Trigger</strong>
          <span class="muted small">Scope and value</span>
        </div>
        <span class="badge">Status</span>
      </div>
      <div class="table-row">
        <div>
          <strong>ETH-PERP above $3,500</strong>
          <span class="muted small">Price alert</span>
        </div>
        <span class="badge warning">Planned</span>
      </div>
      <div class="table-row">
        <div>
          <strong>Wallet margin risk high</strong>
          <span class="muted small">Wallet activity alert</span>
        </div>
        <span class="badge warning">Planned</span>
      </div>
    </div>
  </article>
</section>
