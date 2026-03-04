/**
 * POST /api/billing
 *
 * Creates a Stripe Checkout Session for plan upgrades.
 * Returns the checkout URL that the client should redirect to.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY         — your Stripe secret key
 *   STRIPE_PRO_PRICE_ID       — Stripe Price ID for the Pro plan
 *   STRIPE_ENTERPRISE_PRICE_ID — Stripe Price ID for the Enterprise plan
 *   NEXT_PUBLIC_APP_URL       — base URL of your deployment (e.g. https://app.lockup.dev)
 *
 * GET /api/billing — returns the current subscription status for the session user
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"

export const runtime = "nodejs"

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
}

const CheckoutSchema = z.object({
  plan: z.enum(["pro", "enterprise"]),
  annual: z.boolean().default(true),
})

/* ── POST — create Stripe checkout session ─────────────────────────── */

export async function POST(req: Request): Promise<NextResponse> {
  const LIMIT = 5
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many billing requests. Please slow down." },
      { status: 429, headers: rlHeaders }
    )
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    )
  }

  const { plan } = parsed.data
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = PLAN_PRICE_MAP[plan]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // Demo mode — Stripe not configured
  if (!stripeKey || !priceId) {
    return NextResponse.json({
      demo: true,
      message: `Stripe not configured. To activate billing, set STRIPE_SECRET_KEY and STRIPE_${plan.toUpperCase()}_PRICE_ID in .env.local`,
      checkoutUrl: `${appUrl}/pricing`,
    })
  }

  // Production: create Stripe checkout session
  try {
    // Dynamic import to keep Stripe out of the bundle when not configured
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" })

    // TODO: Get real customer ID from session/database
    // const session = await getServerSession()
    // const user = await prisma.user.findUnique({ where: { email: session.user.email } })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?billing=success&plan=${plan}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // customer: user.stripeCustomerId,  // re-use existing Stripe customer
      metadata: { plan, source: "lockup_dashboard" },
    })

    return NextResponse.json({ checkoutUrl: checkoutSession.url }, { headers: rlHeaders })
  } catch (err) {
    console.error("[Billing] Stripe error:", err)
    return NextResponse.json(
      { error: "Failed to create checkout session. Please contact support." },
      { status: 500 }
    )
  }
}

/* ── GET — fetch current subscription status ───────────────────────── */

export async function GET(): Promise<NextResponse> {
  // STUB — production implementation:
  // 1. Get user from session
  // 2. Fetch Stripe subscription via user.stripeCustomerId
  // 3. Return current plan, renewal date, usage counts

  return NextResponse.json({
    plan: "pro",
    status: "active",
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usage: {
      scansThisMonth: 42,
      scansLimit: null, // null = unlimited
      assetsConnected: 12,
      assetsLimit: 10,
    },
  })
}
