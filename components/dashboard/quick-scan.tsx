"use client"

import { GitBranch, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function QuickScan() {
  const handleConnect = (provider: string) => {
    toast.success(`${provider} connected!`, {
      description: "Repositories are being synced...",
    })
  }

  const handleScanLatest = () => {
    toast.success("Scanning latest repository...", {
      description: "Estimated completion: ~47 seconds",
    })
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-base">One-Click Scan</CardTitle>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            ~47s scan time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-border text-foreground hover:bg-secondary hover:border-foreground/20"
            onClick={() => handleConnect("GitHub")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Connect GitHub
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-border text-foreground hover:bg-secondary hover:border-foreground/20"
            onClick={() => handleConnect("GitLab")}
          >
            <GitBranch className="h-4 w-4" />
            Connect GitLab
          </Button>
        </div>
        <Button
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={handleScanLatest}
        >
          <Zap className="h-4 w-4" />
          Scan My Latest Repo
        </Button>
      </CardContent>
    </Card>
  )
}
