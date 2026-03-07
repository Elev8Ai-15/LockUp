"use client"

import dynamic from "next/dynamic"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

// Dynamic import with SSR disabled to prevent Radix ID hydration mismatch
const TopNavbar = dynamic(
  () => import("@/components/top-navbar").then((mod) => mod.TopNavbar),
  { ssr: false }
)

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main id="main-content" className="flex-1 grid-bg p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-border px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Built for the AI + On-Chain + Web Era &middot; 96% Auto-Fix Rate &middot; Powered by 28 OSS tools + 4 Agentic LLMs
          </p>
        </footer>
      </SidebarInset>
      <Toaster
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
    </SidebarProvider>
  )
}
