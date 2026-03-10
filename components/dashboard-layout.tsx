"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { Toaster } from "sonner"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Render loading state on server to avoid Radix ID hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading LockUp...</p>
        </div>
      </div>
    )
  }
  
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
