export function setPublicCache(res, seconds = 900, stale = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=${stale}`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export function numberParam(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export async function fetchJson(url, { timeoutMs = 4500, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MonarchMigrationLive/0.1 (chrisizworski.com)', 'Accept': 'application/json', ...headers },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Upstream ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
