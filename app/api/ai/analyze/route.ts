/**
 * POST /api/ai/analyze
 *
 * Sends a vulnerability description to the Anthropic Claude API and streams
 * back a structured security analysis including:
 *   - Root cause explanation
 *   - Exploitability assessment
 *   - Step-by-step remediation guidance
 *   - Secure code patch
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY — your Anthropic API key (keep secret, never expose to client)
 *
 * The response is streamed so the UI can show analysis token-by-token,
 * matching the "agent collaboration" experience. Falls back to a static
 * mock response when the API key is not configured (dev/demo mode).
 */

import { NextResponse } from "next/server"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"
import { parseBody, AIAnalyzeRequestSchema } from "@/lib/validators"

export const runtime = "nodejs"

/* ── System prompt ────────────────────────────────────────────────────── */

function buildSystemPrompt(): string {
  return `You are a senior application security engineer and penetration tester with deep expertise in:
- OWASP Top 10 web vulnerabilities
- Smart contract security (Solidity, EVM, DeFi protocols)
- Static and dynamic analysis (SAST/DAST)
- Software composition analysis (SCA)
- AI-generated code security risks ("Shadow AI")
- Secure coding practices across TypeScript, Python, Rust, Go, and Solidity

When analyzing a vulnerability you MUST:
1. Explain the ROOT CAUSE clearly in 2-3 sentences.
2. Assess EXPLOITABILITY: who can exploit it, under what conditions, what is the impact.
3. Provide a CVSS v3.1 breakdown if a score is given.
4. Give a concrete, STEP-BY-STEP REMEDIATION plan.
5. Output a SECURE CODE PATCH in the same language as the vulnerable code.
6. Note any related vulnerabilities the developer should check for.

Format your response in clear sections. Be specific and actionable — avoid generic advice.`
}

function buildUserPrompt(data: {
  title: string
  description: string
  codeSnippet?: string
  vulnType?: string
  cvss?: number
}): string {
  const lines: string[] = [
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

  lines.push("", "Please provide a complete security analysis and remediation.")

  return lines.filter((l) => l !== null).join("\n")
}

/* ── Mock fallback (no API key configured) ───────────────────────────── */

function mockAnalysisStream(title: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const content = `## Security Analysis: ${title}

### Root Cause
This vulnerability arises from insufficient input validation and trust of user-supplied data before it reaches a sensitive sink (DOM, SQL query, external call, etc.).

### Exploitability
An unauthenticated remote attacker can exploit this vulnerability by crafting a malicious payload and submitting it through the affected input vector. Successful exploitation may lead to data exfiltration, privilege escalation, or denial of service.

### Remediation Steps
1. **Validate all inputs** at the boundary where data enters the system using an allowlist approach.
2. **Encode outputs** context-appropriately (HTML-encode for DOM, parameterize for SQL, etc.).
3. **Apply the principle of least privilege** — ensure the affected component runs with minimal permissions.
4. **Add regression tests** that prove the vulnerability is no longer exploitable.
5. **Review related code paths** that accept the same type of user input.

### Secure Code Patch
\`\`\`typescript
// Always validate and sanitize before use
import { z } from 'zod'

const InputSchema = z.string().max(500).regex(/^[\\w\\s.,@-]+$/)
const safeInput = InputSchema.parse(rawUserInput)
\`\`\`

### Related Vulnerabilities to Check
- Similar input vectors in the same module
- Other endpoints that share the same validation logic
- Transitive dependencies that may introduce the same class of bug

> ⚠️ This is a demo analysis. Configure \`ANTHROPIC_API_KEY\` for real AI-powered analysis.`

  return new ReadableStream({
    start(controller) {
      const chunks = content.match(/.{1,50}/gs) ?? [content]
      let i = 0
      const push = () => {
        if (i < chunks.length) {
          controller.enqueue(encoder.encode(chunks[i++]))
          setTimeout(push, 20)
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
  // 1. Rate limiting — 30 AI requests per minute per IP
  const LIMIT = 30
  const rl = rateLimit(req, { limit: LIMIT, windowMs: 60_000 })
  const rlHeaders = rateLimitHeaders(rl, LIMIT)

  if (!rl.success) {
    return NextResponse.json(
      { error: "AI rate limit reached. Please wait a moment." },
      { status: 429, headers: rlHeaders }
    )
  }

  // 2. Parse and validate
  const { data, error } = await parseBody(req, AIAnalyzeRequestSchema)
  if (error) {
    return NextResponse.json({ error }, { status: 400, headers: rlHeaders })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  // 3. Fallback to mock stream when no API key is configured
  if (!apiKey) {
    return new Response(mockAnalysisStream(data.title), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Demo-Mode": "true",
        ...rlHeaders,
      },
    })
  }

  // 4. Call Claude API — streaming response
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        stream: true,
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildUserPrompt(data),
          },
        ],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error("[AI Analyze] Anthropic API error:", claudeRes.status, errText)
      return NextResponse.json(
        { error: "AI analysis temporarily unavailable. Please try again." },
        { status: 502, headers: rlHeaders }
      )
    }

    // Forward the SSE stream from Anthropic to the client
    // Extract only the text_delta events to keep the client side simple
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = claudeRes.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ""
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const json = line.slice(6).trim()
              if (json === "[DONE]") continue

              try {
                const event = JSON.parse(json)
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta"
                ) {
                  controller.enqueue(encoder.encode(event.delta.text))
                }
              } catch {
                // Skip malformed SSE lines
              }
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
      { error: "Internal server error during AI analysis." },
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
