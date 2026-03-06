import { NextRequest, NextResponse } from "next/server"
import { scanAPI } from "@/lib/scanner/api-scanner"

export const maxDuration = 60

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

    // Validate URL format
    try {
      const testUrl = url.startsWith("http") ? url : `https://${url}`
      new URL(testUrl)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
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
