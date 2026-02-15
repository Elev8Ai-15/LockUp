import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
        <Shield className="h-8 w-8 text-primary" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-bold text-foreground tracking-tight">404</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This page could not be found. It may have been moved or the URL might be incorrect.
        </p>
      </div>
      <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}
