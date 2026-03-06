import { NextRequest, NextResponse } from "next/server"
import { scanRepository } from "@/lib/scanner/repo-scanner"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, options = {} } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      )
    }

    // Validate it looks like a GitHub repo
    const isValidRepo = /github\.com\/[^\/]+\/[^\/\s]+/.test(url) || 
                        /^[^\/\s]+\/[^\/\s]+$/.test(url)

    if (!isValidRepo) {
      return NextResponse.json(
        { error: "Invalid GitHub repository format. Use: owner/repo or github.com/owner/repo" },
        { status: 400 }
      )
    }

    const result = await scanRepository(url, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Repo Scanner Error]", error)
    return NextResponse.json(
      { 
        error: "Scan failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
