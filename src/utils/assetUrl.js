const base = import.meta.env.BASE_URL || '/';
const ABSOLUTE_URL_RE = /^(?:[a-z]+:)?\/\//i;

export const withBase = (path) => `${base}${String(path || '').replace(/^\/+/, '')}`;

export const resolveAssetUrl = (value) => {
  const src = String(value || '').trim();
  if (!src) return '';
  if (ABSOLUTE_URL_RE.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  return withBase(src);
};
