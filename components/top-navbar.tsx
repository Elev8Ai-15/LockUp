"use client"

import { Search, Bell, Plus, ChevronDown, Crown, Globe, Smartphone, Code, Shield } from "lucide-react"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

export function TopNavbar() {
  const handleNewScan = (type: string) => {
    toast.success(`${type} scan queued successfully!`, {
      description: "Estimated completion: ~47 seconds.",
    })
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repos, sites, apps, contracts..."
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Scan</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border-border text-foreground">
              <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleNewScan("Code Repo")}>
                <Code className="h-4 w-4 text-primary" />
                Code Repo
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleNewScan("Website URL")}>
                <Globe className="h-4 w-4 text-primary" />
                Website URL
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleNewScan("Web/Mobile App")}>
                <Smartphone className="h-4 w-4 text-primary" />
                Web/Mobile App
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleNewScan("Smart Contract")}>
                <Shield className="h-4 w-4 text-accent" />
                Smart Contract
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

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
