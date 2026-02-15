import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatCards } from "@/components/dashboard/stat-cards"

describe("StatCards", () => {
  it("renders all four stat cards", () => {
    render(<StatCards />)

    expect(screen.getByText("Total Scans")).toBeInTheDocument()
    expect(screen.getByText("Vulns Fixed")).toBeInTheDocument()
    expect(screen.getByText("AI Fix Rate")).toBeInTheDocument()
    expect(screen.getByText("Assets Scanned")).toBeInTheDocument()
  })

  it("renders formatted stat values from mock data", () => {
    render(<StatCards />)

    // stats.totalScans = 1247 -> "1,247"
    expect(screen.getByText("1,247")).toBeInTheDocument()
    // stats.vulnsFixed = 892 -> "892"
    expect(screen.getByText("892")).toBeInTheDocument()
    // stats.aiFixRate = 96 -> "96%"
    expect(screen.getByText("96%")).toBeInTheDocument()
    // stats.assetsScanned = 312 -> "312"
    expect(screen.getByText("312")).toBeInTheDocument()
  })
})
