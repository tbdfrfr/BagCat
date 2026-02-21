import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import {
  normalizeCatalog,
  buildCatalogIndex,
  normalizePlayableUrl,
  shouldUseScramjet,
} from './catalog.js';

const parseJsonFile = async (path, fallback) => {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

export const createCatalogLoader = ({ catalogPath, whitelistPath, cacheMs = 5000 }) => {
  let catalogCache = null;
  let catalogLoadedAt = 0;

  return async () => {
    const now = Date.now();
    if (catalogCache && now - catalogLoadedAt < cacheMs) return catalogCache;

    const rawCatalog = await parseJsonFile(catalogPath, {});
    const normalized = normalizeCatalog(rawCatalog);
    const index = buildCatalogIndex(normalized);
    const whitelistRaw = await parseJsonFile(whitelistPath, []);
    const whitelist = Array.isArray(whitelistRaw) ? whitelistRaw : [];

    catalogCache = {
      apps: normalized.apps,
      games: normalized.games,
      index,
      whitelist,
    };
    catalogLoadedAt = now;

    return catalogCache;
  };
};

export const resolveProxyMode = ({ entry, targetUrl, whitelist = [], scramjetEnabled = false }) => {
  if (!scramjetEnabled) return 'uv';
  const explicit = String(entry?.proxyMode || '').toLowerCase();
  if (explicit === 'uv' || explicit === 'scr') return explicit;
  return shouldUseScramjet(targetUrl, whitelist) ? 'scr' : 'uv';
};

const encodeUvUrl = (targetUrl, requestHost) => {
  const host = String(requestHost || '').trim();
  const seed = `${new Date().toISOString().slice(0, 10)}${host}`;
  const keyString = Buffer.from(seed, 'utf8')
    .toString('base64')
    .split('')
    .reverse()
    .join('')
    .slice(6.7);
  const keyBytes = Buffer.from(keyString, 'utf8');
  const source = Buffer.from(targetUrl, 'utf8');

  if (!keyBytes.length) return source.toString('hex');

  const out = Buffer.alloc(source.length);
  for (let i = 0; i < source.length; i++) out[i] = source[i] ^ keyBytes[i % 8];
  return out.toString('hex');
};

export const createPlayPath = ({ targetUrl, mode, requestHost }) =>
  mode === 'scr'
    ? `/scramjet/${encodeURIComponent(targetUrl)}`
    : `/uv/service/${encodeUvUrl(targetUrl, requestHost)}`;

export const getEntryTargetUrl = (entry) => {
  const rawUrl = Array.isArray(entry?.url) ? entry.url[0] : entry?.url;
  return normalizePlayableUrl(rawUrl);
};

export const createLaunchStore = (ttlMs = 10 * 60 * 1000) => {
  const sessions = new Map();

  return {
    issue(payload) {
      const token = randomBytes(24).toString('base64url');
      sessions.set(token, {
        ...payload,
        expiresAt: Date.now() + ttlMs,
      });
      return token;
    },
    read(token) {
      const session = sessions.get(token);
      if (!session) return null;
      if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
      }
      return session;
    },
    purgeExpired() {
      const now = Date.now();
      for (const [token, session] of sessions) {
        if (now > session.expiresAt) sessions.delete(token);
      }
    },
  };
};
