import { test, expect } from "@playwright/test"

test.describe("Blockchain Security", () => {
  test("should load blockchain page with risk oracle", async ({ page }) => {
    await page.goto("/blockchain")
    await expect(page.getByRole("heading", { name: /blockchain security/i }).first()).toBeVisible()
    await expect(page.getByText(/risk oracle/i).first()).toBeVisible()
  })

  test("should show contract upload area", async ({ page }) => {
    await page.goto("/blockchain")
    await expect(page.getByText(/upload/i).first()).toBeVisible()
  })

  test("should display gas optimization table", async ({ page }) => {
    await page.goto("/blockchain")
    await expect(page.getByText(/gas optimization/i).first()).toBeVisible()
  })

  test("should display fund flow diagram", async ({ page }) => {
    await page.goto("/blockchain")
    await expect(page.getByText(/fund flow/i).first()).toBeVisible()
  })
})
