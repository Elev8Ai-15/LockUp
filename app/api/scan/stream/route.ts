/**
 * GET /api/scan/stream?target=<url>&type=<scanType>
 *
 * Server-Sent Events (SSE) endpoint that streams live scan progress,
 * log messages, and findings back to the client in real time.
 *
 * The client connects with EventSource and receives typed events:
 *   - "log"      — scan log line (progress update)
 *   - "finding"  — vulnerability found (title, severity, fix)
 *   - "progress" — scan progress percentage (0-100)
 *   - "complete" — scan is done, all findings delivered
 *   - "error"    — scan failed with reason
 *
 * In production this would be backed by a real scan worker that
 * publishes events to Redis Pub/Sub or a message queue. Here we
 * simulate the full lifecycle so the client wiring works immediately.
 */

import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

/* ── SSE helpers ──────────────────────────────────────────────────── */

function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
}

/* ── Simulated scan pipeline ──────────────────────────────────────── */

type Phase = { pct: number; log: string }

function phasesForTarget(target: string, scanType: string): Phase[] {
  const t = target.toLowerCase()
  const isContract = t.includes("0x") || t.includes(".sol") || t.includes("defi")
  const isRepo = t.includes("github") || t.includes("git") || t.includes("/")

  const base: Phase[] = [
    { pct: 2,  log: `[INIT] Connecting to target: ${target}` },
    { pct: 5,  log: "[INFO] Target reachable — fingerprinting stack" },
    { pct: 10, log: `[INFO] Scan type: ${scanType}` },
  ]

  if (isContract) {
    return [...base,
      { pct: 15, log: "[INFO] Compiling Solidity contracts..." },
      { pct: 25, log: "[INFO] Running Slither static analysis..." },
      { pct: 35, log: "[WARN] Reentrancy detector: checking external calls..." },
      { pct: 45, log: "[INFO] Running Mythril symbolic execution (EVM bytecode)..." },
      { pct: 55, log: "[WARN] Suspicious pattern: state update after call" },
      { pct: 65, log: "[INFO] Checking access control modifiers..." },
      { pct: 70, log: "[INFO] Running Echidna property-based fuzzing..." },
      { pct: 78, log: "[WARN] Oracle manipulation surface detected" },
      { pct: 85, log: "[INFO] Generating CVSS v3.1 scores..." },
      { pct: 92, log: "[INFO] Fix Agent generating Solidity patches..." },
      { pct: 96, log: "[INFO] Validator Agent verifying patches compile..." },
      { pct: 99, log: "[DONE] Smart contract audit complete" },
    ]
  }

  if (isRepo) {
    return [...base,
      { pct: 12, log: "[INFO] Cloning repository (shallow fetch)..." },
      { pct: 20, log: "[INFO] Running Semgrep SAST with OWASP ruleset..." },
      { pct: 30, log: "[INFO] Running Bandit (Python) / ESLint-security (JS)..." },
      { pct: 38, log: "[INFO] Shadow AI detector scanning for vibe-coded patterns..." },
      { pct: 48, log: "[WARN] AI-generated code detected (confidence: 92%)" },
      { pct: 55, log: "[INFO] Running npm audit / pip-audit / cargo audit..." },
      { pct: 62, log: "[WARN] Vulnerable dependency found in node_modules" },
      { pct: 70, log: "[INFO] Scanning git history for leaked secrets (Gitleaks)..." },
      { pct: 78, log: "[INFO] Cross-referencing GHSA and OSV databases..." },
      { pct: 85, log: "[INFO] Fix Agent generating language-specific patches..." },
      { pct: 92, log: "[INFO] Validator Agent running test suite against patches..." },
      { pct: 97, log: "[INFO] Preparing PR diff for GitHub integration..." },
      { pct: 99, log: "[DONE] Repository scan complete" },
    ]
  }

  // Website / web app
  return [...base,
    { pct: 12, log: "[INFO] Spider crawling target site..." },
    { pct: 20, log: `[INFO] Discovered ${Math.floor(Math.random() * 100 + 50)} endpoints` },
    { pct: 28, log: "[INFO] Running OWASP ZAP active scan..." },
    { pct: 36, log: "[INFO] Testing injection vectors (SQLi, XSS, SSTI)..." },
    { pct: 44, log: "[WARN] Reflected parameter detected — testing XSS..." },
    { pct: 50, log: "[INFO] Running Nuclei 10k+ CVE template library..." },
    { pct: 58, log: "[INFO] Testing OWASP API Top 10 vectors (BOLA, BFLA)..." },
    { pct: 65, log: "[INFO] Checking security headers (CSP, HSTS, X-Frame)..." },
    { pct: 72, log: "[WARN] Missing Content-Security-Policy header" },
    { pct: 80, log: "[INFO] Testing authentication and session management..." },
    { pct: 87, log: "[INFO] Generating CVSS v3.1 scores for all findings..." },
    { pct: 93, log: "[INFO] Fix Agent generating framework-specific patches..." },
    { pct: 98, log: "[DONE] Web security scan complete" },
  ]
}

/* ── Route handler ────────────────────────────────────────────────── */

export async function GET(req: Request): Promise<Response> {
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000 })
  if (!rl.success) {
    return new Response(
      sseEvent("error", { message: "Rate limit exceeded" }),
      { status: 429, headers: { "Content-Type": "text/event-stream" } }
    )
  }

  const url = new URL(req.url)
  const target = url.searchParams.get("target") ?? ""
  const scanType = url.searchParams.get("type") ?? "Full Spectrum"

  if (!target) {
    return NextResponse.json({ error: "Missing ?target= parameter" }, { status: 400 })
  }

  if (target.length > 500) {
    return NextResponse.json({ error: "Target parameter too long" }, { status: 400 })
  }

  const phases = phasesForTarget(target, scanType)
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Helper to send a typed SSE event
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)))
      }

      // Send initial connection confirmation
      send("log", { message: `[INIT] Scan session opened for: ${target}`, pct: 0 })

      // Stream log events across simulated scan phases
      for (const phase of phases) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300))
        send("log", { message: phase.log, pct: phase.pct })
        send("progress", { pct: phase.pct })
      }

      // Emit findings based on target type
      const t = target.toLowerCase()
      await new Promise((r) => setTimeout(r, 500))

      if (t.includes("0x") || t.includes(".sol") || t.includes("defi")) {
        send("finding", {
          id: `F-${Date.now()}-1`, title: "Reentrancy in withdraw()", severity: "critical",
          file: "contracts/Vault.sol", line: 89, cvss: 9.8,
          description: "CEI pattern violation — external call before state update allows fund drainage.",
        })
        await new Promise((r) => setTimeout(r, 300))
        send("finding", {
          id: `F-${Date.now()}-2`, title: "Missing access control on setFee()", severity: "high",
          file: "contracts/Governance.sol", line: 45, cvss: 8.6,
          description: "setFee() has no onlyOwner modifier — anyone can set fees to 100%.",
        })
      } else if (t.includes("github") || t.includes("/")) {
        send("finding", {
          id: `F-${Date.now()}-1`, title: "Hardcoded API secret in source", severity: "critical",
          file: "src/config/api.ts", line: 8, cvss: 8.7,
          description: "API key present in git history — rotate immediately.",
        })
        await new Promise((r) => setTimeout(r, 300))
        send("finding", {
          id: `F-${Date.now()}-2`, title: "Prompt injection vulnerability", severity: "critical",
          file: "src/api/chat.ts", line: 23, cvss: 9.0,
          description: "User input concatenated into LLM system prompt — attackers can override instructions.",
        })
      } else {
        send("finding", {
          id: `F-${Date.now()}-1`, title: "Reflected XSS on /search", severity: "critical",
          file: "/search?q=", line: 0, cvss: 9.1,
          description: "Unsanitized user input reflected in DOM — session cookie theft possible.",
        })
        await new Promise((r) => setTimeout(r, 300))
        send("finding", {
          id: `F-${Date.now()}-2`, title: "SQL Injection in search API", severity: "critical",
          file: "/api/search", line: 0, cvss: 9.5,
          description: "Blind time-based SQLi confirmed — full database read/write.",
        })
        await new Promise((r) => setTimeout(r, 300))
        send("finding", {
          id: `F-${Date.now()}-3`, title: "BOLA — Broken Object Level Authorization", severity: "critical",
          file: "/api/users/:id", line: 0, cvss: 9.3,
          description: "No ownership check on user resource endpoint — any user can access any account.",
        })
      }

      // Complete event
      await new Promise((r) => setTimeout(r, 500))
      send("complete", {
        scanId: `scan_${Date.now()}`,
        target,
        scanType,
        completedAt: new Date().toISOString(),
        message: "Scan complete — fix code generated for all findings.",
      })
      send("progress", { pct: 100 })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering
    },
  })
}
