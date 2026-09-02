/**
 * Server-side in-memory TTL cache.
 *
 * This is intentionally database-free: results are keyed by a string and kept
 * in the Next.js server process for a bounded TTL. A single in-flight promise
 * is shared between concurrent requests so we never hammer the official
 * government servers with duplicate lookups.
 *
 * NOTE: In-memory state is per server instance/process. For a horizontally
 * scaled deployment, swap this module for Redis/Upstash without touching any
 * scraper code (they only use the `cached()` helper).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    storedAt: Date.now(),
  });
}

export function cacheHas(key: string): boolean {
  return cacheGet(key) !== undefined;
}

export function cacheDelete(key: string): void {
  store.delete(key);
  inflight.delete(key);
}

export function cacheStoredAt(key: string): number | undefined {
  const entry = store.get(key);
  return entry?.storedAt;
}

export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export function cacheStats(): { size: number } {
  return { size: store.size };
}

/**
 * Returns the cached value for `key` or loads it via `loader`, caches the
 * result for `ttlMs` and de-duplicates concurrent calls.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = loader()
    .then((value) => {
      if (value !== undefined && value !== null) cacheSet(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}