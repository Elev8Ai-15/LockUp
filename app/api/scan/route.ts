/**
 * POST /api/scan
 *
 * Initiates a security scan for the given target. Validates the request,
 * applies rate limiting, and returns a scan ID that the client can poll.
 *
 * In production this would enqueue a job to a background worker (e.g. a
 * queue or serverless function) that runs the actual OSS toolchain.
 * For now it returns a deterministic mock response so the frontend has a
 * real API contract to build against.
 */

import { NextResponse } from "next/server"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"
import { parseBody, ScanRequestSchema, type ScanRequest } from "@/lib/validators"

export const runtime = "nodejs"

/* ── Helpers ──────────────────────────────────────────────────────────── */

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Estimate toolchain based on scan type — ready for real orchestration */
function toolsForScanType(scanType: ScanRequest["scanType"]): string[] {
  switch (scanType) {
    case "Website DAST":
      return ["OWASP ZAP", "Nuclei"]
    case "Web App":
      return ["OWASP ZAP", "Nuclei", "Semgrep"]
    case "Code Repo":
      return ["Semgrep", "Bandit", "Gosec", "ESLint Security"]
    case "Smart Contract":
      return ["Slither", "Mythril", "Echidna"]
    case "Full Spectrum":
      return ["Semgrep", "OWASP ZAP", "Nuclei", "Slither", "Mythril"]
    default:
      return ["Semgrep"]
  }
}

/* ── Route handler ────────────────────────────────────────────────────── */

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Rate limiting — 10 scan initiations per minute per IP
  const LIMIT = 10
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many scan requests. Please wait before trying again." },
      { status: 429, headers: rlHeaders }
    )
  }

  // 2. Parse and validate request body
  const { data, error } = await parseBody(req, ScanRequestSchema)
  if (error) {
    return NextResponse.json({ error }, { status: 400, headers: rlHeaders })
  }

  // 3. Basic target sanitization — strip leading/trailing whitespace
  const target = data.target.trim()

  // 4. Build the scan record
  const scanId = generateScanId()
  const tools = toolsForScanType(data.scanType)
  const estimatedDurationSeconds = data.scanType === "Full Spectrum" ? 120 : 45

  const scanRecord = {
    id: scanId,
    target,
    scanType: data.scanType,
    agenticMode: data.agenticMode,
    tools,
    status: "queued" as const,
    createdAt: new Date().toISOString(),
    estimatedDurationSeconds,
    // Poll endpoint — real implementation would track state in a DB
    statusUrl: `/api/scan/${scanId}/status`,
  }

  // TODO: Enqueue to job queue (e.g. Inngest, BullMQ, or Vercel Crons)
  // await queue.enqueue("security-scan", scanRecord)

  return NextResponse.json(scanRecord, {
    status: 202, // Accepted — processing is async
    headers: rlHeaders,
  })
}

/* ── CORS preflight ───────────────────────────────────────────────────── */

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
