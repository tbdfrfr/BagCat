<p align="center">
  <img width="196.2" height="192.6" alt="BagCat Logo" src="https://github.com/user-attachments/assets/cac7007d-0a95-4708-a21e-9d84ca339399" />
</p>

<h1 align="center">BagCat</h1>

<p align="center">
  <b>BagCat</b> provides access to a wide variety of web games and apps, all in one place.
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/ba97c5a9-0df8-46f8-b574-0df04b31cc4d" />
  <img src="https://github.com/user-attachments/assets/b6134b74-ce4f-4df9-bef5-7da59f63355e" />
  <img src="https://github.com/user-attachments/assets/366e118b-bab5-4aaa-98e4-8396be8ea419" />
  <img src="https://github.com/user-attachments/assets/83b4464f-f5e7-4227-9eb8-05da193cb5ad" />
  <img src="https://github.com/user-attachments/assets/41be675c-1b5d-4461-9b4f-c9e89fcb8ef9" />
</p>

---

## Features

- Access to popular web games and apps
- Proxy-based unblocking for school/work networks
- Dynamic game catalog and backend-driven launches
- Fast, modern React frontend
- Privacy-focused and open source

<details>
  <summary>Games & Apps Included</summary>
  
  1. GeForce Now
  2. Retro Bowl
  3. Twitch
  4. YouTube
  5. TikTok
  6. Discord
  7. Netflix
  8. ...and many more browser games!
</details>

---
## Getting Started

### For Users (No Experience Needed)

You can run BagCat right in your browser using GitHub Codespaces—no setup or coding required!

1. **Open this repository on GitHub.**
2. Click the **"Code"** button, then select **"Create codespace on main"**.
3. Wait a minute for Codespaces to warm up. It will install everything for you!
4. When it's ready, look for the **"Terminal"** at the bottom. Type these commands, one at a time:
  ```bash
npm ci && npm run build
npm run start
  ```
5. Finally Open [http://localhost:2345](http://localhost:2345) in your browser!

You should now see BagCat running! If you get stuck, ask for help in our Discord.

---

### For Developers

BagCat is a full-stack app with a React frontend and a Fastify-based Node.js backend. It uses a proxy system to serve games and apps. 

sry my code is messy lol :p

#### Manual Setup

1. Clone the repository and install dependencies:
  ```bash
  git clone https://github.com/tbdfrfr/BagCat.git
  cd BagCat
  npm install
  ```
2. Build and start the app:
  ```bash
npm ci && npm run build
npm run start
  ```
3. Open [http://localhost:2345](http://localhost:2345) in your browser.

#### How It Works

- **Frontend:** React (see `src/`), uses Vite for building.
- **Backend:** Node.js with Fastify (see `server.js`), serves API endpoints and proxies game traffic.
- **Game Catalog:** Served from `GET /api/catalog` (see `shared/catalog.js`).
- **Game Launch:** `POST /api/launch` with a game `id` returns a `/play/<token>/` URL.
- **Proxy:** Requests to `/play/<token>/` are routed through `/uv/service/...` or `/scramjet/...` for unblocking.

#### Main Dependencies

- Node.js v18+
- npm v9+
- fastify, @fastify/static, @fastify/compress, @fastify/cookie
- @titaniumnetwork-dev/ultraviolet, @mercuryworkshop/bare-mux, @mercuryworkshop/scramjet, @mercuryworkshop/wisp-js
- React, React DOM, Vite, Tailwind CSS, MUI

See `package.json` for the full list.

---

## Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or pull request.

---

## Community

Join our Discord to request games/features, report bugs, and chat with the community:

[Discord Invite Link](https://discord.gg/your-invite-here)

---

## Screenshots

Homepage
<img width="1866" height="897" alt="image" src="https://github.com/user-attachments/assets/39762993-f636-4c0f-aa91-514584a49cf8" />

Geforce Now
<img width="1856" height="942" alt="image" src="https://github.com/user-attachments/assets/606c4f35-0b36-4e3e-bed6-959d3f1b12a8" />

Balatro theme :D
<img width="1867" height="991" alt="image" src="https://github.com/user-attachments/assets/da7bf350-d41f-42d8-9ecc-7b9c8b369c34" />






<sub>BagCat is a project for fun and learning. Enjoy and share with friends! :3</sub>



