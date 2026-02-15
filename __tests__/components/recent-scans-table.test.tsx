import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RecentScansTable } from "@/components/dashboard/recent-scans-table"

describe("RecentScansTable", () => {
  it("renders the Recent Activity heading", () => {
    render(<RecentScansTable />)
    expect(screen.getByText("Recent Activity")).toBeInTheDocument()
  })

  it("renders all asset names from mock data", () => {
    render(<RecentScansTable />)
    expect(screen.getByText("frontend-app")).toBeInTheDocument()
    expect(screen.getByText("vault-contracts")).toBeInTheDocument()
    expect(screen.getByText("yoursite.com")).toBeInTheDocument()
    expect(screen.getByText("api-gateway")).toBeInTheDocument()
  })

  it("renders status badges", () => {
    render(<RecentScansTable />)
    // Multiple "completed" badges
    const completedBadges = screen.getAllByText("completed")
    expect(completedBadges.length).toBeGreaterThan(0)
  })

  it("renders Auto-Fix Applied badges for auto-fixed scans", () => {
    render(<RecentScansTable />)
    const autoFixBadges = screen.getAllByText("Auto-Fix Applied")
    expect(autoFixBadges.length).toBe(2) // frontend-app and app.example.com
  })

  it("renders a View All button", () => {
    render(<RecentScansTable />)
    expect(screen.getByText("View All")).toBeInTheDocument()
  })
})
