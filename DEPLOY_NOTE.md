# Hyperwallet Deploy Note

## Prerequisites

| Requirement | Value |
|---|---|
| **Node.js** | ≥ 18.x |
| **MongoDB** | A running instance (local or cloud) |
| **MONGODB_URI** | Connection string to your MongoDB |
| **Server** | VPS / cloud VM with public IP or domain |

---

## 1. Environment Variables

Create a `.env` file in the `hyperwallet/` root:

```env
# Required
MONGODB_URI=mongodb://127.0.0.1:27017/celestial_hyperwallet

# Optional (future use)
# HYPERWALLET_DB_NAME=celestial_hyperwallet
# HYPERWALLET_COLLECTION_PREFIX=
# MAIN_APP_API_URL=
# VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
```

---

## 2. Build

```bash
cd hyperwallet
npm install
npm run build
```

This produces the production build in `.svelte-kit/output/`.

---

## 3. Production Server

### 3a. Run directly (Node.js)

```bash
# Set NODE_ENV for the built app
NODE_ENV=production node .svelte-kit/output/server/index.js
```

The server starts on **`http://0.0.0.0:3000`** (default SvelteKit adapter-node port).

**To change the port:**

```bash
PORT=8080 NODE_ENV=production node .svelte-kit/output/server/index.js
```

### 3b. Run with process manager (recommended)

```bash
npm install -g pm2
pm2 start .svelte-kit/output/server/index.js --name hyperwallet
pm2 save
pm2 startup
```

---

## 4. Reverse Proxy (for HTTPS + PWA)

PWA **requires HTTPS** on production. Use a reverse proxy like **Nginx** or **Caddy**.

### Nginx example

```nginx
server {
    listen 443 ssl;
    server_name hyperwallet.yourdomain.com;

    ssl_certificate     /etc/ssl/certs/yourdomain.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy (simpler — auto HTTPS)

```caddyfile
hyperwallet.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

---

## 5. PWA Verification

After deployment, verify installability using Chrome DevTools:

1. Open `https://hyperwallet.yourdomain.com` in Chrome
2. Open **DevTools → Application → Manifest**
3. Check that:
   - Manifest is parsed successfully
   - Service worker is registered and active
   - "Installability" section shows no errors
4. The install prompt should appear in the address bar

**Android:**
- Open `https://hyperwallet.yourdomain.com` in Chrome
- Tap the **"Install"** banner or the three-dot menu → **"Add to Home screen"**

**iOS:**
- Open in Safari
- Tap the **Share** button → **"Add to Home Screen"**

---

## 6. Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server (no PWA install prompt — HTTP) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run check` | Type-check with svelte-check |
| `npm run db:seed` | Seed sample wallets into DB |
| `npm run db:indexes` | Create MongoDB indexes |
| `npm run wallet:sync` | Manual wallet sync (CLI) |

---

## 7. Common Issues

| Issue | Fix |
|---|---|
| `Missing required environment variable: MONGODB_URI` | Create `.env` with `MONGODB_URI=...` |
| MongoDB connection refused | Ensure MongoDB is running on the expected host:port |
| PWA install prompt not appearing | Must be accessed via **HTTPS** (or localhost). Use a reverse proxy for HTTPS |
| Service worker not registering | Check Chrome DevTools → Application → Service Workers for errors |
| Build out of memory | `npm run build` already uses `--max-old-space-size=8192`. Increase if needed |
| Android shows only shortcut, not PWA | Clear Chrome cache, ensure HTTPS, wait a few seconds for SW to activate |
