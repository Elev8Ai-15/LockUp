"use client"

import { useState } from "react"
import { Globe, Zap, Smartphone, Code, Shield, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function QuickScan() {
  const [url, setUrl] = useState("")

  const handleScan = (type: string) => {
    if (!url.trim()) {
      toast.error("Enter a URL, repo, or contract address to scan")
      return
    }
    toast.success(`${type} scan started for ${url}`, {
      description: "Estimated completion: ~47 seconds.",
    })
    setUrl("")
  }

  return (
    <Card className="bg-card border-primary/20 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Start a Scan</h1>
              <p className="text-xs text-muted-foreground">Paste a URL, repo, or contract address to scan instantly</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://yoursite.com, github.com/user/repo, or 0xContractAddress"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm h-10"
                onKeyDown={(e) => { if (e.key === "Enter") handleScan("Full Spectrum") }}
              />
            </div>
            <Button
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-5 shrink-0"
              onClick={() => handleScan("Full Spectrum")}
            >
              <Zap className="h-4 w-4" />
              Scan Now
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => handleScan("Website DAST")}>
              <Globe className="h-3.5 w-3.5 text-success" /> Website
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => handleScan("Web App")}>
              <Smartphone className="h-3.5 w-3.5 text-primary" /> Web App
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => handleScan("Code Repo")}>
              <Code className="h-3.5 w-3.5 text-primary" /> Repo
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => handleScan("Smart Contract")}>
              <Shield className="h-3.5 w-3.5 text-accent" /> Smart Contract
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
