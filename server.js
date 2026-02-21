import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import compress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createBareServer } from "@tomphttp/bare-server-node";
import { MasqrMiddleware } from "./masqr.js";
import {
  createCatalogLoader,
  resolveProxyMode,
  createPlayPath,
  getEntryTargetUrl,
  createLaunchStore,
} from "./shared/launch.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const catalogPath = join(__dirname, "src", "data", "apps.json");
const whitelistPath = join(__dirname, "src", "data", "whitelist.json");

const port = process.env.PORT || 2345;
const server = createServer();
const bare = process.env.BARE !== "false" ? createBareServer("/seal/") : null;
logging.set_level(logging.NONE);
const CATALOG_CACHE_MS = Number(process.env.CATALOG_CACHE_MS || 5000);
const LAUNCH_TTL_MS = Number(process.env.LAUNCH_TTL_MS || 10 * 60 * 1000);
const SCRAMJET_ENABLED = process.env.SCRAMJET === "true";
const loadCatalog = createCatalogLoader({
  catalogPath,
  whitelistPath,
  cacheMs: CATALOG_CACHE_MS,
});
const launchStore = createLaunchStore(LAUNCH_TTL_MS);

Object.assign(wisp.options, {
  dns_method: "resolve",
  dns_servers: ["1.1.1.3", "1.0.0.3"],
  dns_result_order: "ipv4first"
});

setInterval(() => {
  launchStore.purgeExpired();
}, 60_000).unref();

server.on("upgrade", (req, sock, head) =>
  bare?.shouldRoute(req)
    ? bare.routeUpgrade(req, sock, head)
    : req.url.endsWith("/wisp/")
      ? wisp.routeRequest(req, sock, head)
      : sock.end()
);

const app = Fastify({
  serverFactory: h => (
    server.on("request", (req, res) =>
      bare?.shouldRoute(req) ? bare.routeRequest(req, res) : h(req, res)
    ),
    server
  ),
  logger: false,
  keepAliveTimeout: 30000,
  connectionTimeout: 60000,
  forceCloseConnections: true
});

await app.register(fastifyCookie);
await app.register(compress, { global: true, encodings: ['gzip','deflate','br'] });

app.register(fastifyStatic, {
  root: join(__dirname, "dist"),
  prefix: "/",
  decorateReply: true,
  etag: true,
  lastModified: true,
  cacheControl: true,
  setHeaders(res, path) {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    } else if (/\.[a-f0-9]{8,}\./.test(path)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  }
});

if (process.env.MASQR === "true")
  app.addHook("onRequest", MasqrMiddleware);

app.get("/api/catalog", async (_req, reply) => {
  try {
    const catalog = await loadCatalog();
    return reply.send({ apps: catalog.apps, games: catalog.games });
  } catch {
    return reply.code(500).send({ error: "catalog_unavailable" });
  }
});
app.post("/api/launch", async (req, reply) => {
  try {
    const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
    if (!id) return reply.code(400).send({ error: "id_required" });

    const catalog = await loadCatalog();
    const entry = catalog.index.get(id);
    if (!entry) return reply.code(404).send({ error: "game_not_found" });
    if (entry.disabled) return reply.code(403).send({ error: "game_disabled" });
    if (entry.local) return reply.code(400).send({ error: "local_game_not_proxyable" });

    const targetUrl = getEntryTargetUrl(entry);
    if (!targetUrl) return reply.code(400).send({ error: "invalid_target_url" });

    const mode = resolveProxyMode({
      entry,
      targetUrl,
      whitelist: catalog.whitelist,
      scramjetEnabled: SCRAMJET_ENABLED,
    });
    const playPath = createPlayPath({
      targetUrl,
      mode,
      requestHost: req.headers.host,
    });
    const token = launchStore.issue({
      playPath,
      mode,
      gameId: entry.id,
    });

    return reply.send({
      playUrl: `/play/${token}/`,
      mode,
      gameId: entry.id,
    });
  } catch {
    return reply.code(500).send({ error: "launch_failed" });
  }
});
app.get("/play/:token/", async (req, reply) => {
  const token = typeof req.params?.token === "string" ? req.params.token : "";
  const session = launchStore.read(token);
  if (!session) return reply.code(404).type("text/plain").send("Launch session expired");
  return reply.redirect(session.playPath);
});
app.get("/play/:token", async (req, reply) => {
  const token = typeof req.params?.token === "string" ? req.params.token : "";
  const session = launchStore.read(token);
  if (!session) return reply.code(404).type("text/plain").send("Launch session expired");
  return reply.redirect(session.playPath);
});
app.get("/healthz", async (_req, reply) => reply.code(200).type("text/plain").send("ok"));
app.get("/ds", (req, res) => res.redirect("https://discord.com/invite/9qSBZpmPNV"));

app.setNotFoundHandler((req, reply) =>
  req.raw.method === "GET" && req.headers.accept?.includes("text/html")
    ? reply.sendFile("index.html")
    : reply.code(404).send({ error: "Not Found" })
);

// Bind to all interfaces so both 127.0.0.1 and ::1 work consistently.
app.listen({ port, host: "0.0.0.0" }).then(() => console.log(`Server running on ${port}`));
