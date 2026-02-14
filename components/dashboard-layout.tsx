"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { Toaster } from "sonner"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-svh w-full bg-background">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 grid-bg p-4 md:p-6">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main className="flex-1 grid-bg p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-border px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Built for the AI + On-Chain + Web Era &middot; 96% Auto-Fix Rate &middot; Powered by 28 OSS tools + 4 Agentic LLMs
          </p>
        </footer>
      </SidebarInset>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#132419",
            border: "1px solid #1F3D2B",
            color: "#E2E8F0",
          },
        }}
      />
    </SidebarProvider>
  )
}
