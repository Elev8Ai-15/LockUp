"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Eye, EyeOff, Lock, Mail, User, Zap, ArrowRight, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const levels = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-primary" },
    { label: "Strong", color: "bg-success" },
    { label: "Very Strong", color: "bg-success" },
  ]
  return { score, ...levels[score] }
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = passwordStrength(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (strength.score < 2) {
      setError("Please choose a stronger password (min 8 characters).")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.")
        return
      }

      toast.success("Account created!", { description: "Welcome to LockUp. Your free plan is active." })
      router.push("/")
    } catch {
      setError("Network error — please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground">LockUp</span>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <h1 className="text-2xl font-bold text-foreground text-center">Create your account</h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Free plan · No credit card required
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Benefits summary */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex flex-col gap-1.5">
              {[
                "5 free scans/month — SAST, DAST, SCA",
                "OWASP Top 10 + API Security coverage",
                "Vulnerability reports with fix code",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  {b}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Work email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="jane@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {password && (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={`flex-1 rounded-full transition-colors ${s <= strength.score ? strength.color : "bg-secondary"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] ${strength.score <= 1 ? "text-destructive" : strength.score <= 2 ? "text-warning" : "text-success"}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              >
                {loading ? "Creating account..." : "Create free account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <Separator className="bg-border" />

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>

            <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
              By registering you agree to our Terms of Service and Privacy Policy.
              Source code is never stored — scans run ephemerally and are deleted after 24 hours.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
