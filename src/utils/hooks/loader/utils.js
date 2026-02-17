const k = new TextEncoder().encode(
  btoa(new Date().toISOString().slice(0, 10) + location.host)
    .split('')
    .reverse()
    .join('')
    .slice(6.7),
);
const encoding = {
  enc: (s) => {
    if (!s) return s;
    try {
      const d = new TextEncoder().encode(s),
        o = new Uint8Array(d.length);
      for (let i = 0; i < d.length; i++) o[i] = d[i] ^ k[i % 8];
      return Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return s;
    }
  },
  dnc: (s) => {
    if (!s) return s;
    try {
      const n =
        Math.min(
          s.indexOf('?') + 1 || s.length + 1,
          s.indexOf('#') + 1 || s.length + 1,
          s.indexOf('&') + 1 || s.length + 1,
        ) - 1;
      let h = 0;
      for (let i = 0; i < n && i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) break;
        h = i + 1;
      }
      if (h < 2 || h % 2) return decodeURIComponent(s);
      const l = h >> 1,
        o = new Uint8Array(l);
      for (let i = 0; i < l; i++) {
        const x = i << 1;
        o[i] = parseInt(s[x] + s[x + 1], 16) ^ k[i % 8];
      }
      return new TextDecoder().decode(o) + s.slice(h);
    } catch {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    }
  },
};

const base = import.meta.env.BASE_URL || '/';
const withBase = (p) => `${base}${String(p || '').replace(/^\/+/, '')}`;
const DEFAULT_ENGINE = 'https://www.google.com/search?q=';

const normalizeEngine = (engine) => {
  if (typeof engine !== 'string') return DEFAULT_ENGINE;
  const trimmed = engine.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : DEFAULT_ENGINE;
};

const isLikelyHost = (value) =>
  /^(localhost(?::\d+)?|[\w-]+(?:\.[\w-]+)+(?::\d+)?)(?:\/|$)/i.test(value);

const check = (inp, engine) => {
  const trimmed = typeof inp === 'string' ? inp.trim() : String(inp || '').trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (isLikelyHost(trimmed)) return `https://${trimmed}`;
  return normalizeEngine(engine) + encodeURIComponent(trimmed);
};

import whitelist from '/src/data/whitelist.json';
const scrwlist = new Set((whitelist || []).map((d) => String(d || '').replace(/^www\./, '').toLowerCase()));

const useScrForHost = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost')) return false;
    if (host.endsWith('.io')) return true;
    return [...scrwlist].some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

export const resolveProxyMode = (input, prType = 'auto', engine = DEFAULT_ENGINE) => {
  switch (prType) {
    case 'uv':
      return 'uv';
    case 'scr':
      return 'scr';
    default: {
      const url = check(input, engine);
      return useScrForHost(url) ? 'scr' : 'uv';
    }
  }
};

export const process = (input, decode = false, prType = 'auto', engine = DEFAULT_ENGINE) => {
  const searchEngine = normalizeEngine(engine);

  if (decode) {
    const safeInput = typeof input === 'string' ? input : String(input || '');
    const uvPart = safeInput.split('/uv/service/')[1];
    const scrPart = safeInput.split('/scramjet/')[1];
    let decoded = safeInput;
    if (uvPart) {
      decoded = encoding.dnc(uvPart);
    } else if (scrPart) {
      try {
        decoded = decodeURIComponent(scrPart);
      } catch {
        decoded = scrPart;
      }
    }
    return decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  } else {
    const final = check(input, searchEngine);
    if (!final) return '';
    const mode = resolveProxyMode(final, prType, searchEngine);
    const prefix = mode === 'scr' ? withBase('scramjet/') : withBase('uv/service/');
    const encoded = mode === 'scr' ? encodeURIComponent(final) : encoding.enc(final);
    return `${location.protocol}//${location.host}${prefix}${encoded}`;
  }
};
