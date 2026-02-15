import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QuickScan } from "@/components/dashboard/quick-scan"
import { toast } from "sonner"

describe("QuickScan", () => {
  it("renders the Quick Scan card with input and buttons", () => {
    render(<QuickScan />)
    expect(screen.getByText("Quick Scan")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("https://yoursite.com or app.example.com")).toBeInTheDocument()
    expect(screen.getByText("Website")).toBeInTheDocument()
    expect(screen.getByText("Web App")).toBeInTheDocument()
    expect(screen.getByText("Full Spectrum Scan")).toBeInTheDocument()
  })

  it("triggers toast on Website scan click", async () => {
    const user = userEvent.setup()
    render(<QuickScan />)

    const websiteBtn = screen.getByText("Website")
    await user.click(websiteBtn)

    expect(toast.success).toHaveBeenCalledWith(
      "Website scan initiated!",
      expect.objectContaining({ description: expect.any(String) })
    )
  })

  it("triggers toast on Full Spectrum Scan click", async () => {
    const user = userEvent.setup()
    render(<QuickScan />)

    const fullBtn = screen.getByText("Full Spectrum Scan")
    await user.click(fullBtn)

    expect(toast.success).toHaveBeenCalledWith(
      "Full Spectrum scan initiated!",
      expect.objectContaining({ description: expect.any(String) })
    )
  })

  it("includes the URL in scan toast when provided", async () => {
    const user = userEvent.setup()
    render(<QuickScan />)

    const input = screen.getByPlaceholderText("https://yoursite.com or app.example.com")
    await user.type(input, "https://test.com")
    await user.click(screen.getByText("Website"))

    expect(toast.success).toHaveBeenCalledWith(
      "Website scan initiated!",
      expect.objectContaining({ description: "Scanning https://test.com..." })
    )
  })

  it("clears the input after scanning", async () => {
    const user = userEvent.setup()
    render(<QuickScan />)

    const input = screen.getByPlaceholderText("https://yoursite.com or app.example.com") as HTMLInputElement
    await user.type(input, "https://test.com")
    expect(input.value).toBe("https://test.com")

    await user.click(screen.getByText("Website"))
    expect(input.value).toBe("")
  })
})
