import { withBase } from './assetUrl';

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const requestJson = async (path, init = {}) => {
  const response = await fetch(withBase(path), {
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const fetchCatalog = (signal) =>
  requestJson('/api/catalog', {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

export const launchGame = (gameId, signal) =>
  requestJson('/api/launch', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: gameId }),
  });
