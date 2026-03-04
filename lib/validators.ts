/**
 * Centralised Zod validation schemas for all API boundaries.
 *
 * Every public-facing API route should validate its request body with the
 * relevant schema here before touching any business logic. This prevents
 * injection attacks, type confusion, and malformed data from propagating.
 */

import { z } from "zod"

/* ── Shared primitives ────────────────────────────────────────────────── */

/** URL that must use http or https (no javascript:, data:, etc.) */
const safeUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), {
    message: "Only http/https URLs are accepted",
  })

/** Ethereum-compatible contract address (0x + 40 hex chars) */
const contractAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid contract address — expected 0x + 40 hex chars")

/** GitHub repository in owner/repo format */
const githubRepo = z
  .string()
  .regex(/^[\w.-]+\/[\w.-]+$/, "Expected GitHub repo in owner/repo format")
  .max(200)

/* ── Scan target ─────────────────────────────────────────────────────── */

export const ScanTargetSchema = z.union([
  z.object({ type: z.literal("url"), target: safeUrl }),
  z.object({ type: z.literal("repo"), target: githubRepo }),
  z.object({ type: z.literal("contract"), target: contractAddress }),
])

export type ScanTarget = z.infer<typeof ScanTargetSchema>

/* ── POST /api/scan ──────────────────────────────────────────────────── */

export const ScanRequestSchema = z.object({
  target: z.string().min(1, "Target is required").max(500, "Target too long"),
  scanType: z.enum(["Website DAST", "Web App", "Code Repo", "Smart Contract", "Full Spectrum"]),
  agenticMode: z.boolean().optional().default(false),
})

export type ScanRequest = z.infer<typeof ScanRequestSchema>

/* ── POST /api/ai/analyze ────────────────────────────────────────────── */

export const AIAnalyzeRequestSchema = z.object({
  /** Vulnerability title or short description to analyze */
  title: z.string().min(1).max(200),
  /** Detailed description of the vulnerability */
  description: z.string().min(1).max(2000),
  /** Optional code snippet to include in the analysis */
  codeSnippet: z.string().max(4000).optional(),
  /** Vulnerability type for specialist context */
  vulnType: z
    .enum(["SAST", "DAST", "SCA", "Web", "App", "Blockchain", "Shadow AI"])
    .optional(),
  /** CVSS score (0-10) */
  cvss: z.number().min(0).max(10).optional(),
})

export type AIAnalyzeRequest = z.infer<typeof AIAnalyzeRequestSchema>

/* ── POST /api/ai/chat ───────────────────────────────────────────────── */

export const AIChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
})

export const AIChatRequestSchema = z.object({
  messages: z
    .array(AIChatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages in history"),
  /** Vulnerability context to include in the system prompt */
  vulnContext: z
    .object({
      id: z.string().optional(),
      title: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
})

export type AIChatRequest = z.infer<typeof AIChatRequestSchema>

/* ── Webhook payload ─────────────────────────────────────────────────── */

export const WebhookPayloadSchema = z.object({
  event: z.enum(["scan.completed", "vuln.found", "fix.applied", "agent.finished"]),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
})

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

/* ── Helper ──────────────────────────────────────────────────────────── */

/**
 * Parse and validate a JSON request body with a Zod schema.
 * Returns `{ data, error }` — never throws.
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { data: null, error: "Request body must be valid JSON" }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")
    return { data: null, error: messages }
  }

  return { data: result.data, error: null }
}
