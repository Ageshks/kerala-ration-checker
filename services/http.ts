/**
 * Thin HTTP client used ONLY server-side. Enforces:
 *  - a user-agent
 *  - a hard timeout (AbortController)
 *  - per-host polite rate limiting
 *  - one bounded retry for transient failures
 *
 * The browser never calls these functions — imports of this module must stay
 * inside Server Components, Server Actions or Route Handlers.
 */

import { RATE_LIMITS, REQUEST_TIMEOUT_MS, USER_AGENT } from "@/lib/constants";
import { ScrapeError } from "@/services/errors";

export interface RateLimitState {
  lastCallAt: number;
  minuteWindowStart: number;
  callsThisMinute: number;
}

const rateStates = new Map<string, RateLimitState>();

function honorRateLimit(host: string): number {
  const policy = RATE_LIMITS[host];
  if (!policy) return 0;

  const now = Date.now();
  let state = rateStates.get(host);
  if (!state) {
    state = { lastCallAt: 0, minuteWindowStart: now, callsThisMinute: 0 };
    rateStates.set(host, state);
  }

  const elapsed = now - state.lastCallAt;
  if (elapsed < policy.minIntervalMs) {
    return policy.minIntervalMs - elapsed;
  }
  if (now - state.minuteWindowStart > 60_000) {
    state.minuteWindowStart = now;
    state.callsThisMinute = 0;
  }
  if (state.callsThisMinute >= policy.maxPerMinute) {
    throw new ScrapeError("RATE_LIMITED", `Rate limit reached for ${host}`, host);
  }
  return 0;
}

function markCalled(host: string): void {
  const state = rateStates.get(host);
  if (state) {
    state.lastCallAt = Date.now();
    state.callsThisMinute += 1;
  }
}

/** Best-effort sleep. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

async function doFetch(
  url: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const host = hostOf(url);
  const wait = honorRateLimit(host);
  if (wait > 0) await sleep(wait);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  markCalled(host);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        ...init?.headers,
      },
      cache: "no-store",
    });
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ScrapeError("TIMEOUT", `Request to ${host} timed out`, host, { cause: err });
    }
    throw new ScrapeError("NETWORK", `Request to ${host} failed`, host, { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

/** POST application/x-www-form-urlencoded and return the response text. */
export async function postFormText(
  url: string,
  body: Record<string, string | number>,
  options?: { timeoutMs?: number }
): Promise<string> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    params.append(k, String(v));
  }

  let res: Response;
  try {
    res = await doFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: params.toString(),
    }, options?.timeoutMs);
  } catch (err) {
    throw ScrapeError.fromUnknown(err);
  }

  if (!res.ok) {
    throw new ScrapeError(
      "SOURCE_UNAVAILABLE",
      `Upstream ${url} returned HTTP ${res.status}`,
      hostOf(url)
    );
  }
  return await res.text();
}

/** GET with one retry on transient failure, returns parsed JSON. */
export async function getJson<T>(
  url: string,
  options?: { timeoutMs?: number; retries?: number }
): Promise<T> {
  const retries = options?.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await doFetch(url, { method: "GET" }, options?.timeoutMs);
      if (res.status === 404) {
        throw new ScrapeError("NOT_FOUND", `Upstream ${url} returned 404`, hostOf(url));
      }
      if (!res.ok) {
        throw new ScrapeError(
          "SOURCE_UNAVAILABLE",
          `Upstream ${url} returned HTTP ${res.status}`,
          hostOf(url)
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (err instanceof ScrapeError && err.kind !== "NETWORK" && err.kind !== "TIMEOUT") {
        throw err;
      }
      if (attempt < retries) await sleep(600 * (attempt + 1));
    }
  }
  throw ScrapeError.fromUnknown(lastError);
}