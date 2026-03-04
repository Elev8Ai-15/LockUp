/**
 * POST /api/auth/register
 *
 * Creates a new user account with hashed password.
 * Stub implementation — replace DB call with real ORM.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  email: z.string().email("Invalid email").max(254).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limit: 5 registrations per IP per hour
  const LIMIT = 5
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 60 * 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "Registration rate limit reached. Please try again later." },
      { status: 429, headers: rlHeaders }
    )
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    return NextResponse.json({ error: msg }, { status: 400, headers: rlHeaders })
  }

  const { name, email, password } = parsed.data

  // STUB — production implementation:
  // 1. Check if email already exists
  //    const existing = await prisma.user.findUnique({ where: { email } })
  //    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  //
  // 2. Hash password with bcrypt (cost factor 12+)
  //    const passwordHash = await bcrypt.hash(password, 12)
  //
  // 3. Create user in database
  //    const user = await prisma.user.create({
  //      data: { name, email, passwordHash, plan: "free" },
  //    })
  //
  // 4. Send verification email (SendGrid, Resend, etc.)
  //    await sendVerificationEmail(email, user.id)
  //
  // 5. Create Stripe customer for billing
  //    const customer = await stripe.customers.create({ email, name })
  //    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } })

  // Simulate success for demo
  void password // hash in production

  const response = NextResponse.json({
    user: { name, email, plan: "free" },
    message: "Account created successfully. Welcome to LockUp!",
  }, { status: 201 })

  // Set session cookie immediately after registration
  response.cookies.set("lockup_session", `lockup_sess_${Date.now()}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
