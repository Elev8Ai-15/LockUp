"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { Toaster } from "sonner"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main className="flex-1 grid-bg p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#0F1629",
            border: "1px solid #1E293B",
            color: "#E2E8F0",
          },
        }}
      />
    </SidebarProvider>
  )
}
