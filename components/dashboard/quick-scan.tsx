"use client"

import { useState } from "react"
import { Globe, Zap, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function QuickScan() {
  const [url, setUrl] = useState("")

  const handleScan = (type: string) => {
    toast.success(`${type} scan initiated!`, {
      description: url ? `Scanning ${url}...` : "Scanning latest asset...",
    })
    setUrl("")
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-base">Quick Scan</CardTitle>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">~47s</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          placeholder="https://yoursite.com or app.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 border-border text-foreground hover:bg-secondary text-xs"
            onClick={() => handleScan("Website")}
          >
            <Globe className="h-3.5 w-3.5 text-success" />
            Website
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 border-border text-foreground hover:bg-secondary text-xs"
            onClick={() => handleScan("Web App")}
          >
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            Web App
          </Button>
        </div>
        <Button
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={() => handleScan("Full Spectrum")}
        >
          <Zap className="h-4 w-4" />
          Full Spectrum Scan
        </Button>
      </CardContent>
    </Card>
  )
}
