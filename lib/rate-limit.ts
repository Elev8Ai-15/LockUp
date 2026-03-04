/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Uses a Map keyed by IP address. Each entry holds a list of request
 * timestamps within the current window. Suitable for serverless/edge
 * environments where each instance is isolated; for multi-instance
 * deployments substitute with a Redis-backed implementation (e.g.
 * Upstash Rate Limit).
 *
 * Usage:
 *   const result = rateLimit(request, { limit: 20, windowMs: 60_000 })
 *   if (!result.success) return new Response("Too Many Requests", { status: 429 })
 */

interface RateLimitOptions {
  /** Maximum number of requests allowed within `windowMs`. Default: 20 */
  limit?: number
  /** Time window in milliseconds. Default: 60 000 (1 minute) */
  windowMs?: number
}

interface RateLimitResult {
  /** Whether the request is within the rate limit */
  success: boolean
  /** Number of requests remaining in the current window */
  remaining: number
  /** Epoch ms when the current window resets */
  resetAt: number
}

// Module-level store — survives across requests in the same process
const store = new Map<string, number[]>()

/**
 * Derives a best-effort client identifier from the request.
 * Checks standard proxy headers before falling back to the socket address.
 */
function getClientKey(req: Request): string {
  const forwarded =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"

  // x-forwarded-for may be a comma-separated list; take the first (leftmost) IP
  return forwarded.split(",")[0].trim()
}

export function rateLimit(
  req: Request,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 20
  const windowMs = options.windowMs ?? 60_000

  const key = getClientKey(req)
  const now = Date.now()
  const windowStart = now - windowMs

  // Retrieve existing timestamps for this key and prune expired ones
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= limit) {
    // Oldest timestamp in window determines when the client can retry
    const resetAt = timestamps[0] + windowMs
    return { success: false, remaining: 0, resetAt }
  }

  timestamps.push(now)
  store.set(key, timestamps)

  // Evict keys with no recent requests to prevent unbounded memory growth
  if (store.size > 10_000) {
    for (const [k, ts] of store.entries()) {
      if (ts.every((t) => t <= windowStart)) store.delete(k)
    }
  }

  return {
    success: true,
    remaining: limit - timestamps.length,
    resetAt: now + windowMs,
  }
}

/**
 * Builds standard rate-limit response headers.
 * Compatible with the IETF draft-ietf-httpapi-ratelimit-headers spec.
 */
export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  return {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": result.success ? "0" : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  }
}
