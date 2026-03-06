import { NextRequest, NextResponse } from "next/server"
import { scanContract } from "@/lib/scanner/smart-contract-scanner"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, options = {} } = body

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Contract address is required" },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address.trim())

    if (!isValidAddress) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format. Must be 0x followed by 40 hex characters." },
        { status: 400 }
      )
    }

    const result = await scanContract(address, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Contract Scanner Error]", error)
    return NextResponse.json(
      { 
        error: "Scan failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
