<p align="center">
  <img width="196.2" height="192.6" alt="header-image" src="https://github.com/user-attachments/assets/cac7007d-0a95-4708-a21e-9d84ca339399" />
</p>


<p align="center">
  <img src="https://github.com/user-attachments/assets/ba97c5a9-0df8-46f8-b574-0df04b31cc4d" />
  <img src="https://github.com/user-attachments/assets/b6134b74-ce4f-4df9-bef5-7da59f63355e" />
  <img src="https://github.com/user-attachments/assets/366e118b-bab5-4aaa-98e4-8396be8ea419" />
  <img src="https://github.com/user-attachments/assets/83b4464f-f5e7-4227-9eb8-05da193cb5ad" />
  <img src="https://github.com/user-attachments/assets/41be675c-1b5d-4461-9b4f-c9e89fcb8ef9" />
</p>





BagCat Is an online proxy service that serves many fun games!

<details>
  <summary>Games/apps currently included:</summary>
  
  1. GeForce now
  2. Retro bowl
  3. Twitch
  4. Youtube
  5. tiktok
  6. Discord
  7. Netflix
  8. and many other browser games :3
</details>
<br>
<br>
Join our discord to request games/features, report bugs, and join the community! [Discord link]

<<<<<<< HEAD
=======
## Quick Start (Full App)

This project is now backend-driven for game launches and catalog data.

Run locally:

```bash
npm install
npm run build
npm run start
```

Open `http://localhost:2345`.

Core flow:

- Frontend requests game catalog from `GET /api/catalog`.
- User selects a game.
- Frontend requests launch session from `POST /api/launch` with `id`.
- Backend returns `/play/<token>/`.
- `GET /play/<token>/` redirects into proxy path (`/uv/service/...` or `/scramjet/...`).

## Railway Full-Stack Deploy (Recommended)

Run frontend + backend together in one Railway service.

Required service settings:

- Builder: `Railpack`
- Build command: `npm install --no-audit --no-fund && npm run build`
- Start command: `npm run start`
- Healthcheck path: `/healthz`

This repo also includes `railway.toml` with those defaults.

Notes:

- Do not set `STATIC=true` for this deployment mode.
- `PORT` is read automatically from Railway.
- `/wisp/` and `/seal/` are served by `server.js` in this mode.
>>>>>>> bb08310 (Changed how the frontend/backend behaves, optimized, cleaned up spagetti code)

## Hosting With GitHub Pages + Wisp Backend

### 1) Deploy the Wisp backend

This repo now includes a minimal backend entry:

- `wisp-backend.js`
- health check: `GET /healthz`
- websocket endpoint: `wss://<your-domain>/wisp/`

Start command:

```bash
npm ci
npm run start:wisp
```

Your host must support WebSocket upgrades and HTTPS.

### 2) Point the frontend to your Wisp backend

Set this at build-time for static deployments:

```bash
VITE_WISP_URL=wss://<your-domain>/wisp/
```

If you use this repo's GitHub Pages workflow, set a repository variable named `VITE_WISP_URL` with that value, then build/deploy as usual.

### 3) Optional runtime override (without rebuilding)

In browser devtools:

```js
const current = JSON.parse(localStorage.getItem('options') || '{}');
localStorage.setItem('options', JSON.stringify({ ...current, wServer: 'wss://<your-domain>/wisp/' }));
location.reload();
```
