import { NextRequest, NextResponse } from "next/server"
import { scanWebsite } from "@/lib/scanner/web-scanner"

export const maxDuration = 30

// SSRF protection - block private/internal IPs
function isPrivateIP(hostname: string): boolean {
  // Block localhost variants
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true
  }
  
  // Block private IP ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
    /^192\.168\.\d{1,3}\.\d{1,3}$/,             // 192.168.0.0/16
    /^169\.254\.\d{1,3}\.\d{1,3}$/,             // Link-local
    /^0\.0\.0\.0$/,                              // 0.0.0.0
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // Carrier-grade NAT
  ]
  
  return privateRanges.some(regex => regex.test(hostname))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, options = {} } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
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
    
    // Block private/internal IPs (SSRF protection)
    if (isPrivateIP(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Scanning internal/private IP addresses is not allowed" },
        { status: 400 }
      )
    }

    const result = await scanWebsite(url, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Website Scanner Error]", error)
    return NextResponse.json(
      { 
        error: "Scan failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
