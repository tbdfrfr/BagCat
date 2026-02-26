import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 2345);
const DIST_DIR = join(process.cwd(), "dist");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function safePathFromUrl(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const trimmed = decoded.replace(/^\/+/, "");
  const normalized = normalize(trimmed);
  if (normalized.startsWith("..")) return null;
  return join(DIST_DIR, normalized);
}

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stream = createReadStream(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  stream.pipe(res);
  stream.on("error", () => {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  });
}

const server = createServer((req, res) => {
  if (!existsSync(DIST_DIR)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Missing dist/ directory. Run `npm run build` first.");
    return;
  }

  const requestPath = req.url || "/";
  const resolved = safePathFromUrl(requestPath);

  if (resolved && existsSync(resolved)) {
    const stats = statSync(resolved);
    if (stats.isFile()) {
      sendFile(res, resolved);
      return;
    }
  }

  sendFile(res, join(DIST_DIR, "index.html"));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BagCat server listening on http://0.0.0.0:${PORT}`);
});
