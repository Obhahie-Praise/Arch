/**
 * Lightweight in-memory fetch cache for the web app.
 *
 * Stores responses keyed by URL. Each entry has a TTL (default 60 s).
 * Concurrent requests for the same key are de-duplicated via an in-flight
 * promise map — no duplicate network calls even before the first response
 * has resolved.
 *
 * This cache lives in module scope, so it persists across client-side
 * navigations for the lifetime of the browser tab. It does NOT persist
 * across full page reloads (which is correct — we don't want stale auth).
 *
 * Usage:
 *   const data = await cachedFetch("/api/opportunities/home", { ttl: 60_000 });
 *   cachedFetch.invalidate("/api/opportunities/home");
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 60_000; // 60 seconds

async function cachedFetch<T>(
  url: string,
  options: RequestInit & { ttl?: number } = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL_MS, ...fetchOptions } = options;

  // Return from cache if still valid
  const cached = store.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  // De-duplicate concurrent requests for the same URL
  const existing = inflight.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetch(url, fetchOptions)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      store.set(url, { data: json, expiresAt: Date.now() + ttl });
      return json as T;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}

/** Remove a single cache entry so the next fetch re-queries the server. */
cachedFetch.invalidate = (url: string) => {
  store.delete(url);
  // Don't cancel in-flight — let it finish and re-cache
};

/** Remove all entries whose keys start with the given prefix. */
cachedFetch.invalidatePrefix = (prefix: string) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

/**
 * Synchronously read a cached value without triggering a fetch.
 * Returns the cached data when the entry exists and has not expired,
 * or `null` otherwise.
 *
 * Use this to initialise component state from the cache before the
 * first render so that returning to a page never flashes an empty state
 * when valid data is already available.
 */
cachedFetch.peek = <T>(url: string): T | null => {
  const entry = store.get(url);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  return null;
};

export { cachedFetch };
