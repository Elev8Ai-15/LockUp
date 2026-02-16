"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Globe, Smartphone, Code, FileCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type ScanType = "repo" | "website" | "webapp" | "contract" | null

const scanConfig: Record<Exclude<ScanType, null>, { label: string; placeholder: string; successLabel: string }> = {
  repo: { label: "Code Repository", placeholder: "owner/repository-name", successLabel: "Code Repo" },
  website: { label: "Website (DAST)", placeholder: "https://yoursite.com", successLabel: "DAST Website" },
  webapp: { label: "Web / Mobile App", placeholder: "https://app.yoursite.com", successLabel: "Web App" },
  contract: { label: "Smart Contract", placeholder: "0xContractAddress...", successLabel: "Smart Contract" },
}

export function NewScanButton() {
  const [open, setOpen] = useState(false)
  const [inputMode, setInputMode] = useState<ScanType>(null)
  const [target, setTarget] = useState("")
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputMode])

  const startScan = () => {
    if (!inputMode || !target.trim()) {
      toast.error("Enter a target to scan")
      return
    }
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      toast.success(`${scanConfig[inputMode].successLabel} scan started`, {
        description: `Target: ${target} -- ~47 seconds remaining`,
      })
      setTarget("")
      setInputMode(null)
      setOpen(false)
    }, 800)
  }

  const handleSelect = (type: ScanType) => {
    setInputMode(type)
    setTarget("")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setInputMode(null)
      setTarget("")
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Scan</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-card border-border text-foreground">
        {inputMode ? (
          <div className="p-2 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground px-1">{scanConfig[inputMode].label}</p>
            <Input
              ref={inputRef}
              placeholder={scanConfig[inputMode].placeholder}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") startScan() }}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-xs h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-muted-foreground hover:text-foreground h-7"
                onClick={() => { setInputMode(null); setTarget("") }}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 gap-1"
                onClick={startScan}
                disabled={scanning || !target.trim()}
              >
                {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Scan"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleSelect("repo")}>
              <Code className="h-4 w-4 text-primary" /> Code Repository
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleSelect("website")}>
              <Globe className="h-4 w-4 text-success" /> Website (DAST)
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleSelect("webapp")}>
              <Smartphone className="h-4 w-4 text-primary" /> Web / Mobile App
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 focus:bg-secondary focus:text-foreground" onClick={() => handleSelect("contract")}>
              <FileCode className="h-4 w-4 text-accent" /> Smart Contract
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
