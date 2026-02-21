const asArray = (value) => (Array.isArray(value) ? value : []);

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

export const createCatalogId = (section, category, index, appName) =>
  `${slugify(section)}:${slugify(category)}:${index}:${slugify(appName)}`;

const normalizeEntry = (entry, section, category, index) => {
  const item = entry && typeof entry === 'object' ? { ...entry } : {};
  const appName = typeof item.appName === 'string' && item.appName.trim() ? item.appName : `Game ${index + 1}`;
  item.appName = appName;
  item.id = item.id || createCatalogId(section, category, index, appName);
  return item;
};

export const normalizeCatalog = (rawCatalog) => {
  const source = rawCatalog && typeof rawCatalog === 'object' ? rawCatalog : {};
  const apps = asArray(source.apps).map((entry, index) => normalizeEntry(entry, 'apps', 'apps', index));
  const gamesSource = source.games && typeof source.games === 'object' ? source.games : {};

  const games = {};
  for (const [category, entries] of Object.entries(gamesSource)) {
    games[category] = asArray(entries).map((entry, index) =>
      normalizeEntry(entry, 'games', category, index),
    );
  }

  return { apps, games };
};

export const buildCatalogIndex = (catalog) => {
  const normalized = normalizeCatalog(catalog);
  const index = new Map();

  for (const app of normalized.apps) index.set(app.id, app);
  for (const category of Object.values(normalized.games)) {
    for (const game of category) index.set(game.id, game);
  }

  return index;
};

export const normalizePlayableUrl = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

export const shouldUseScramjet = (targetUrl, whitelist = []) => {
  try {
    const host = new URL(targetUrl).hostname.replace(/^www\./, '').toLowerCase();
    if (host.endsWith('.io')) return true;

    for (const domain of whitelist) {
      const clean = String(domain || '').replace(/^www\./, '').toLowerCase();
      if (!clean) continue;
      if (host === clean || host.endsWith(`.${clean}`)) return true;
    }

    return false;
  } catch {
    return false;
  }
};
