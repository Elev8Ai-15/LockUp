/**
 * GET /api/health
 *
 * Lightweight health check used by load balancers, uptime monitors,
 * and CI pipelines. Returns HTTP 200 with basic runtime diagnostics.
 */

import { NextResponse } from "next/server"

export const runtime = "nodejs"
// Do not cache health checks — always return live data
export const revalidate = 0

interface HealthResponse {
  status: "ok" | "degraded" | "down"
  timestamp: string
  version: string
  uptime: number
  environment: string
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.2.0",
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? "development",
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
