/**
 * POST /api/auth/login
 *
 * Validates credentials and issues a session token.
 * Replace the stub user lookup with your real database/ORM.
 *
 * For production use NextAuth.js, Clerk, or Auth.js rather than
 * rolling your own authentication — this route shows the contract.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"

export const runtime = "nodejs"

const LoginSchema = z.object({
  email: z.string().email("Invalid email address").max(254),
  // Passwords must be at least 8 chars — we check length only here
  // (real validation happens at registration; the hash comparison proves correctness)
  password: z.string().min(8, "Password too short").max(128),
})

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Strict rate limiting on auth routes — 10 attempts per 5 minutes per IP
  const LIMIT = 10
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 5 * 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait before trying again." },
      { status: 429, headers: rlHeaders }
    )
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    return NextResponse.json({ error: msg }, { status: 400, headers: rlHeaders })
  }

  const { email, password } = parsed.data

  // 3. Look up user — STUB (replace with real DB query + bcrypt.compare)
  // Example with Prisma + bcrypt:
  //   const user = await prisma.user.findUnique({ where: { email } })
  //   if (!user || !await bcrypt.compare(password, user.passwordHash)) { ... }

  // Simulate a user for demo — remove in production
  const DEMO_EMAIL = "demo@lockup.dev"
  const DEMO_PASS = "demo1234"

  if (email !== DEMO_EMAIL || password !== DEMO_PASS) {
    // Use a generic message to prevent user enumeration
    await new Promise((r) => setTimeout(r, 300)) // constant-time delay
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401, headers: rlHeaders }
    )
  }

  // 4. Issue session token — STUB
  // In production: create a signed JWT or server-side session
  //   const token = await signJWT({ userId: user.id, email: user.email }, process.env.JWT_SECRET!)
  //   Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/

  const mockToken = `lockup_sess_${Date.now()}`

  const response = NextResponse.json({
    user: { email, name: "Demo User", plan: "pro" },
    message: "Login successful",
  })

  // Set HttpOnly session cookie (Secure in production)
  response.cookies.set("lockup_session", mockToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
