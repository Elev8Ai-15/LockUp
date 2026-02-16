"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Box,
  ScanLine,
  FileText,
  Shield,
  Bot,
  Activity,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Assets", href: "/assets", icon: Box },
  { title: "Scans", href: "/scans", icon: ScanLine },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Agents", href: "/agents", icon: Bot },
  { title: "Blockchain", href: "/blockchain", icon: Shield },
  { title: "Runtime", href: "/runtime", icon: Activity },
  { title: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/lockup-logo.jpg"
            alt="LockUp logo"
            width={28}
            height={28}
            className="rounded shrink-0"
            priority
          />
          <span className="font-mono text-lg font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            LockUp
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        <div className="flex flex-col items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Image
            src="/images/lockup-logo.jpg"
            alt="LockUp hero logo"
            width={80}
            height={80}
            className="rounded-lg opacity-80"
          />
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            Powered by 28 OSS tools + 4 Agentic LLMs
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
