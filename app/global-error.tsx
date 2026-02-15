"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0F1A14] text-[#E2E8F0] font-sans antialiased">
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertTriangle className="h-8 w-8" style={{ color: "#EF4444" }} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              Critical Error
            </h2>
            <p className="text-sm opacity-70 max-w-md">
              The application encountered a critical error and could not recover.
              {error.digest && (
                <span className="block mt-1 font-mono text-xs opacity-50">
                  Error ID: {error.digest}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#89CFF0", color: "#0F1A14" }}
          >
            <RotateCcw className="h-4 w-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  )
}
