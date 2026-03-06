import { NextRequest, NextResponse } from "next/server"
import { scanAPI } from "@/lib/scanner/api-scanner"

export const maxDuration = 60

// SSRF protection - block private/internal IPs
function isPrivateIP(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true
  }
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^169\.254\.\d{1,3}\.\d{1,3}$/,
    /^0\.0\.0\.0$/,
  ]
  return privateRanges.some(regex => regex.test(hostname))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, options = {} } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "API URL is required" },
        { status: 400 }
      )
    }

    // Validate URL format and check for SSRF
    let parsedUrl: URL
    try {
      const testUrl = url.startsWith("http") ? url : `https://${url}`
      parsedUrl = new URL(testUrl)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }
    
    if (isPrivateIP(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Scanning internal/private IP addresses is not allowed" },
        { status: 400 }
      )
    }

    const result = await scanAPI(url, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API Scanner Error]", error)
    return NextResponse.json(
      { 
        error: "Scan failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
