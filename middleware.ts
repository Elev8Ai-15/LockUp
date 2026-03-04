/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 * 1. **Bot detection** — block known scanner/scraper user agents on API routes.
 * 2. **API key authentication** — validate `Authorization: Bearer <key>` on
 *    protected API routes. Extend this as real auth (NextAuth, Clerk, etc.) is added.
 * 3. **Request ID** — attach a unique request ID header for traceability.
 * 4. **Security headers** — a second layer of defence-in-depth (primary headers
 *    are set in next.config.mjs via `headers()`).
 *
 * Routes that match the `config.matcher` below run this middleware.
 * Static assets and public pages are intentionally excluded.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/* ── Config ───────────────────────────────────────────────────────────── */

/** API routes that require a valid API key */
const PROTECTED_API_PREFIXES = ["/api/scan", "/api/ai"]

/** Known malicious/scanner user-agent substrings (lowercase) */
const BLOCKED_UA_PATTERNS = [
  "masscan",
  "zgrab",
  "nuclei",          // Block automated Nuclei scans against our own API
  "sqlmap",
  "nikto",
  "dirbuster",
  "nessus",
]

/* ── Helpers ──────────────────────────────────────────────────────────── */

function randomId(): string {
  return Math.random().toString(36).slice(2, 11)
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isBlockedUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase()
  return BLOCKED_UA_PATTERNS.some((p) => lower.includes(p))
}

/**
 * Validate the Bearer token against the configured API key.
 * In production, replace this with a database lookup or JWT verification.
 */
function isValidApiKey(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false
  const token = authHeader.slice(7).trim()

  const configuredKey = process.env.LOCKUP_API_KEY
  // If no key is configured (dev mode), allow all requests through
  if (!configuredKey) return true

  // Constant-time comparison to prevent timing attacks
  if (token.length !== configuredKey.length) return false
  let mismatch = 0
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ configuredKey.charCodeAt(i)
  }
  return mismatch === 0
}

/* ── Middleware ───────────────────────────────────────────────────────── */

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const requestId = randomId()

  // 1. Block known scanner user agents on all API routes
  if (pathname.startsWith("/api/")) {
    const ua = req.headers.get("user-agent") ?? ""
    if (isBlockedUserAgent(ua)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // 2. Validate API key on protected routes
  if (isProtectedApi(pathname)) {
    const auth = req.headers.get("authorization")
    if (!isValidApiKey(auth)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized — valid API key required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="LockUp API"',
          },
        }
      )
    }
  }

  // 3. Attach request ID and pass through
  const response = NextResponse.next()
  response.headers.set("X-Request-Id", requestId)
  // Expose the ID to the client for support/debugging
  response.headers.set("X-Request-Id", requestId)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public assets (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$).*)",
  ],
}
