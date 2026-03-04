/**
 * POST /api/ai/analyze
 *
 * Streams a Claude Sonnet security analysis for a given vulnerability.
 * Falls back to a mock stream when ANTHROPIC_API_KEY is not set (demo mode).
 */

import { NextResponse } from "next/server"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"
import { parseBody, AIAnalyzeRequestSchema, type AIAnalyzeRequest } from "@/lib/validators"

export const runtime = "nodejs"

/* ── System prompt ────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a senior application security engineer and penetration tester with deep expertise in:
- OWASP Top 10 (2021+) web vulnerabilities
- Smart contract security: Solidity, EVM, DeFi, re-entrancy, oracle manipulation
- AI/LLM security: prompt injection, model inversion, supply-chain poisoning
- API security: BOLA, BFLA, mass assignment, excessive data exposure (OWASP API Top 10)
- Shadow AI risks: vibe-coded functions, insecure AI-generated code patterns
- Cloud-native threats: SSRF, container escapes, IAM misconfigurations
- Cryptography: deprecated algorithms, timing attacks, key management flaws
- Supply chain: dependency confusion, typosquatting, malicious packages

When analyzing a vulnerability, ALWAYS output these sections in order:
## Root Cause
## Attack Scenario
## Remediation Steps
## Secure Code Patch
## Related Vulnerabilities

Be specific, actionable, and include production-ready code in the correct language.`

/* ── Helpers ──────────────────────────────────────────────────────────── */

function buildUserPrompt(data: AIAnalyzeRequest): string {
  const lines = [
    `## Vulnerability: ${data.title}`,
    `**Type**: ${data.vulnType ?? "Unknown"}`,
    data.cvss !== undefined ? `**CVSS Score**: ${data.cvss}` : "",
    "",
    `### Description`,
    data.description,
  ]
  if (data.codeSnippet) {
    lines.push("", "### Affected Code", "```", data.codeSnippet, "```")
  }
  lines.push("", "Provide a complete security analysis and remediation.")
  return lines.filter(Boolean).join("\n")
}

function mockStream(title: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const content = `## Root Cause
This vulnerability arises from insufficient validation of user-supplied data before it reaches a sensitive execution sink (DOM, database, external call, or contract state).

## Attack Scenario
An unauthenticated remote attacker crafts a malicious payload and submits it through the affected input vector. Successful exploitation leads to data exfiltration, privilege escalation, fund drainage, or denial of service depending on the vulnerability class.

## Remediation Steps
1. **Validate all inputs** at the trust boundary using strict allowlist schemas (Zod, Joi, or equivalent).
2. **Encode outputs** context-appropriately: HTML-encode for DOM, parameterize for SQL, use CEI pattern for smart contracts.
3. **Apply least privilege**: the affected component should run with minimal permissions/capabilities.
4. **Add regression tests** that prove the attack vector is no longer viable.
5. **Audit related code paths** accepting the same input type.

## Secure Code Patch
\`\`\`typescript
import { z } from 'zod'

// Define strict input schema
const InputSchema = z.object({
  query: z.string().min(1).max(200).regex(/^[\\w\\s.,@-]+$/),
})

// Validate at the boundary — never trust raw input
const { query } = InputSchema.parse(rawInput)
\`\`\`

## Related Vulnerabilities
- Similar input vectors in the same module
- Transitive dependencies introducing the same vulnerability class
- Shared validation logic that may be bypassed

> ⚠️ Demo mode — set \`ANTHROPIC_API_KEY\` in .env.local for real AI-powered analysis of: **${title}**`

  return new ReadableStream({
    start(controller) {
      const chunks = content.match(/[\s\S]{1,60}/g) ?? [content]
      let i = 0
      const push = () => {
        if (i < chunks.length) {
          controller.enqueue(encoder.encode(chunks[i++]))
          setTimeout(push, 18)
        } else {
          controller.close()
        }
      }
      push()
    },
  })
}

/* ── Route handler ────────────────────────────────────────────────────── */

export async function POST(req: Request): Promise<Response> {
  const LIMIT = 30
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "AI rate limit reached. Please wait a moment." },
      { status: 429, headers: rlHeaders }
    )
  }

  const parsed = await parseBody(req, AIAnalyzeRequestSchema)
  if (parsed.error !== null) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: rlHeaders })
  }
  const { data } = parsed

  const apiKey = process.env.ANTHROPIC_API_KEY

  // Demo/dev mode — stream mock analysis
  if (!apiKey) {
    return new Response(mockStream(data.title), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Demo-Mode": "true",
        ...rlHeaders,
      },
    })
  }

  // Production — call Claude Sonnet and forward the streaming SSE response
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(data) }],
      }),
    })

    if (!claudeRes.ok) {
      console.error("[AI Analyze] Anthropic error:", claudeRes.status)
      return NextResponse.json(
        { error: "AI analysis temporarily unavailable." },
        { status: 502, headers: rlHeaders }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = claudeRes.body?.getReader()
        if (!reader) { controller.close(); return }

        let buf = ""
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buf += decoder.decode(value, { stream: true })
            const lines = buf.split("\n")
            buf = lines.pop() ?? ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const json = line.slice(6).trim()
              if (json === "[DONE]") continue
              try {
                const ev = JSON.parse(json)
                if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                  controller.enqueue(encoder.encode(ev.delta.text))
                }
              } catch { /* skip malformed SSE */ }
            }
          }
        } finally {
          reader.cancel()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        ...rlHeaders,
      },
    })
  } catch (err) {
    console.error("[AI Analyze] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal error during AI analysis." },
      { status: 500, headers: rlHeaders }
    )
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
