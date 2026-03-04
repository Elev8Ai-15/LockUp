"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, Crown, X } from "lucide-react"
import { NewScanButton } from "@/components/new-scan-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

const searchablePages = [
  { label: "Dashboard", href: "/", keywords: ["home", "overview", "stats"] },
  { label: "Assets - Repositories", href: "/assets", keywords: ["repos", "github", "code", "repo"] },
  { label: "Assets - Websites", href: "/assets", keywords: ["sites", "url", "domain", "web"] },
  { label: "Assets - Smart Contracts", href: "/assets", keywords: ["contracts", "solidity", "blockchain", "sol"] },
  { label: "Active Scans", href: "/scans", keywords: ["scan", "scanning", "progress", "active"] },
  { label: "Reports", href: "/reports", keywords: ["vuln", "vulnerability", "findings", "cve", "report"] },
  { label: "Agents", href: "/agents", keywords: ["agent", "triage", "fix", "exploit", "ai", "swarm", "bot"] },
  { label: "Blockchain Security", href: "/blockchain", keywords: ["blockchain", "defi", "oracle", "reentrancy", "smart contract"] },
  { label: "Runtime Monitoring", href: "/runtime", keywords: ["runtime", "api", "traffic", "monitor", "shadow"] },
  { label: "Settings", href: "/settings", keywords: ["settings", "config", "api key", "notifications", "profile"] },
]

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: "critical" | "warning" | "info" | "success"
}

const initialNotifications: Notification[] = [
  { id: "1", title: "Critical: Reentrancy in Vault.sol", description: "defi-protocol scan found a critical reentrancy vulnerability.", time: "2m ago", read: false, type: "critical" },
  { id: "2", title: "Scan Complete: yoursite.com", description: "DAST scan finished with 2 critical findings.", time: "5m ago", read: false, type: "warning" },
  { id: "3", title: "Agent Fix Ready", description: "Fix Agent generated a patch for XSS on /search.", time: "8m ago", read: false, type: "success" },
  { id: "4", title: "New asset connected", description: "frontend-app repo was added via GitHub integration.", time: "15m ago", read: true, type: "info" },
  { id: "5", title: "Scheduled scan started", description: "Weekly full-spectrum scan initiated across all assets.", time: "1h ago", read: true, type: "info" },
]

const notifTypeStyles: Record<string, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-primary",
}

export function TopNavbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const searchRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return searchablePages.filter(
      (page) =>
        page.label.toLowerCase().includes(q) ||
        page.keywords.some((k) => k.includes(q))
    )
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("All notifications marked as read")
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex-1 flex items-center gap-4">
        {/* Functional search with dropdown results */}
        <div className="relative w-full max-w-sm" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages, assets, vulnerabilities..."
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => { if (searchQuery.trim()) setSearchOpen(true) }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {searchOpen && filteredResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50">
              {filteredResults.map((result) => (
                <button
                  key={result.label}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  onClick={() => {
                    router.push(result.href)
                    setSearchQuery("")
                    setSearchOpen(false)
                  }}
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {result.label}
                </button>
              ))}
            </div>
          )}

          {searchOpen && searchQuery.trim().length > 0 && filteredResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-50 px-4 py-3">
              <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* New Scan button */}
        <NewScanButton />

        {/* Notifications popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-card border-border text-foreground">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors cursor-pointer hover:bg-secondary/50 ${!notif.read ? "bg-secondary/20" : ""}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notifTypeStyles[notif.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-relaxed ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{notif.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id) }}
                      className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 text-foreground">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-secondary text-foreground text-xs">DS</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">dev_sec</span>
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/30 text-primary text-[9px] ml-1">PRO</Badge>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border text-foreground">
            <DropdownMenuItem className="focus:bg-secondary focus:text-foreground">Profile</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-secondary focus:text-foreground">
              <Crown className="h-3.5 w-3.5 mr-2 text-warning" />
              Upgrade
              <Badge variant="outline" className="ml-auto text-[10px] border-warning text-warning">PRO</Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="focus:bg-secondary focus:text-foreground">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
