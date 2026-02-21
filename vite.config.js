import { defineConfig, normalizePath } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { logging, server as wisp } from '@mercuryworkshop/wisp-js/server';
import { createBareServer } from '@tomphttp/bare-server-node';
import { bareModulePath } from '@mercuryworkshop/bare-as-module3';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import dotenv from 'dotenv';
import {
  createCatalogLoader,
  resolveProxyMode,
  createPlayPath,
  getEntryTargetUrl,
  createLaunchStore,
} from './shared/launch.js';

dotenv.config();
const useBare = process.env.BARE === 'false' ? false : true;
const isStatic = process.env.STATIC === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const basePath =
  process.env.BASE_PATH ||
  (process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/');

const normalizeBase = (p) => {
  if (!p) return '/';
  let out = p.startsWith('/') ? p : `/${p}`;
  if (!out.endsWith('/')) out += '/';
  return out;
};
const base = normalizeBase(basePath);

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(__dirname, 'src/data/apps.json');
const whitelistPath = resolve(__dirname, 'src/data/whitelist.json');
logging.set_level(logging.NONE);
let bare;
const CATALOG_CACHE_MS = Number(process.env.CATALOG_CACHE_MS || 5000);
const LAUNCH_TTL_MS = Number(process.env.LAUNCH_TTL_MS || 10 * 60 * 1000);
const SCRAMJET_ENABLED = process.env.SCRAMJET === 'true';
const loadCatalog = createCatalogLoader({
  catalogPath,
  whitelistPath,
  cacheMs: CATALOG_CACHE_MS,
});
const launchStore = createLaunchStore(LAUNCH_TTL_MS);

Object.assign(wisp.options, {
  dns_method: 'resolve',
  dns_servers: ['1.1.1.3', '1.0.0.3'],
  dns_result_order: 'ipv4first',
});

const routeRequest = (req, resOrSocket, head) => {
  if (req.url?.startsWith('/wisp/')) return wisp.routeRequest(req, resOrSocket, head);
  if (bare.shouldRoute(req))
    return head ? bare.routeUpgrade(req, resOrSocket, head) : bare.routeRequest(req, resOrSocket);
};

const parseRequestJson = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('payload_too_large'));
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });

const writeJson = (res, code, payload) => {
  const body = JSON.stringify(payload);
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
};

const basePrefix = base === '/' ? '' : base.endsWith('/') ? base.slice(0, -1) : base;
const stripBasePath = (pathname) => {
  if (!basePrefix) return pathname;
  if (pathname === basePrefix) return '/';
  if (pathname.startsWith(`${basePrefix}/`)) return pathname.slice(basePrefix.length);
  return pathname;
};

const obf = {
  enable: true,
  autoExcludeNodeModules: true,
  threadPool: true,
  options: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.3,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'mangled',
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayCallsTransform: false,
    stringArrayThreshold: 0.5,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    ignoreImports: true,
  },
};

export default defineConfig(({ command }) => {
  return {
    base,
    plugins: [
      react(),
      command === 'build' && vitePluginBundleObfuscator(obf),
      viteStaticCopy({
        targets: [
          { src: [normalizePath(resolve(libcurlPath, '*'))], dest: 'libcurl' },
          { src: [normalizePath(resolve(baremuxPath, '*'))], dest: 'baremux' },
          { src: [normalizePath(resolve(scramjetPath, '*'))], dest: 'scram' },
          useBare && { src: [normalizePath(resolve(bareModulePath, '*'))], dest: 'baremod' },
          {
            src: [
              normalizePath(resolve(uvPath, 'uv.handler.js')),
              normalizePath(resolve(uvPath, 'uv.client.js')),
              normalizePath(resolve(uvPath, 'uv.bundle.js')),
              normalizePath(resolve(uvPath, 'sw.js')),
            ],
            dest: 'uv',
          },
        ].filter(Boolean),
      }),
      {
        name: 'server',
        apply: 'serve',
        configureServer(server) {
          bare = createBareServer('/seal/');
          server.httpServer?.on('upgrade', (req, sock, head) => routeRequest(req, sock, head));
          server.middlewares.use((req, res, next) => routeRequest(req, res) || next());
        },
      },
      {
        name: 'launch-api',
        apply: 'serve',
        configureServer(server) {
          const cleanup = setInterval(() => {
            launchStore.purgeExpired();
          }, 60_000);

          server.httpServer?.on('close', () => clearInterval(cleanup));

          server.middlewares.use(async (req, res, next) => {
            const pathname = stripBasePath(new URL(req.url || '/', 'http://localhost').pathname);
            const method = String(req.method || 'GET').toUpperCase();

            if (pathname === '/api/catalog' && method === 'GET') {
              try {
                const catalog = await loadCatalog();
                writeJson(res, 200, { apps: catalog.apps, games: catalog.games });
              } catch {
                writeJson(res, 500, { error: 'catalog_unavailable' });
              }
              return;
            }

            if (pathname === '/api/launch' && method === 'POST') {
              try {
                const body = await parseRequestJson(req);
                const id = typeof body?.id === 'string' ? body.id.trim() : '';
                if (!id) {
                  writeJson(res, 400, { error: 'id_required' });
                  return;
                }

                const catalog = await loadCatalog();
                const entry = catalog.index.get(id);
                if (!entry) {
                  writeJson(res, 404, { error: 'game_not_found' });
                  return;
                }
                if (entry.disabled) {
                  writeJson(res, 403, { error: 'game_disabled' });
                  return;
                }
                if (entry.local) {
                  writeJson(res, 400, { error: 'local_game_not_proxyable' });
                  return;
                }

                const targetUrl = getEntryTargetUrl(entry);
                if (!targetUrl) {
                  writeJson(res, 400, { error: 'invalid_target_url' });
                  return;
                }

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
                const token = launchStore.issue({ playPath, mode, gameId: entry.id });
                writeJson(res, 200, { playUrl: `/play/${token}/`, mode, gameId: entry.id });
              } catch {
                writeJson(res, 500, { error: 'launch_failed' });
              }
              return;
            }

            const playMatch = pathname.match(/^\/play\/([^/]+)\/?$/);
            if (playMatch && method === 'GET') {
              const token = playMatch[1];
              const session = launchStore.read(token);
              if (!session) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Launch session expired');
                return;
              }
              res.statusCode = 302;
              res.setHeader('Location', session.playPath);
              res.end();
              return;
            }

            next();
          });
        },
      },
      {
        name: 'redirect',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/ds') {
              res.writeHead(302, { Location: 'https://discord.com/invite/9qSBZpmPNV' });
              res.end();
            } else {
              next();
            }
          });
        },
      },
    ].filter(Boolean),
    build: {
      target: 'es2022',
      reportCompressedSize: false,
      esbuild: {
        legalComments: 'none',
        treeShaking: true,
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: '[hash].js',
          chunkFileNames: 'chunks/[name].[hash].js',
          assetFileNames: 'assets/[hash].[ext]',
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;
            const m = id.split('node_modules/')[1];
            const pkg = m.startsWith('@') ? m.split('/').slice(0, 2).join('/') : m.split('/')[0];
            if (/react-router|react-dom|react\b/.test(pkg)) return 'react';
            if (/^@mui\//.test(pkg) || /^@emotion\//.test(pkg)) return 'mui';
            if (/lucide/.test(pkg)) return 'icons';
            if (/react-ga4/.test(pkg)) return 'analytics';
            if (/nprogress/.test(pkg)) return 'progress';
            return 'vendor';
          },
        },
        treeshake: {
          moduleSideEffects: 'no-external',
        },
      },
      minify: 'esbuild',
      sourcemap: false,
    },
    css: {
      modules: {
        generateScopedName: () =>
          String.fromCharCode(97 + Math.floor(Math.random() * 17)) +
          Math.random().toString(36).substring(2, 8),
      },
    },
    define: {
      isStaticBuild: JSON.stringify(isStatic),
    },
  };
});
