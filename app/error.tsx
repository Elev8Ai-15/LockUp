"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AppScan] Uncaught error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 border border-destructive/30">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          An unexpected error occurred while loading this page.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs text-muted-foreground/70">
              Error ID: {error.digest}
            </span>
          )}
        </p>
      </div>
      <Button onClick={reset} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}
