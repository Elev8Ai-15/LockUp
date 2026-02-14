"use client"

import { useState } from "react"
import { Search, Bell, Plus, ChevronDown, Zap, Crown } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

export function TopNavbar() {
  const [newScanOpen, setNewScanOpen] = useState(false)

  const handleNewScan = () => {
    setNewScanOpen(false)
    toast.success("Scan queued successfully!", {
      description: "Your repository will be scanned in approximately 47 seconds.",
    })
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repos, vulns, contracts..."
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
            onClick={() => setNewScanOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Scan</span>
          </Button>

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

      <Dialog open={newScanOpen} onOpenChange={setNewScanOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Start New Scan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a repository to scan for vulnerabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Input
              placeholder="Enter repository URL or name..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary" onClick={handleNewScan}>
                <Zap className="h-4 w-4 mr-2 text-primary" />
                Quick Scan
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleNewScan}>
                Deep Scan
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan in ~47 seconds
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
