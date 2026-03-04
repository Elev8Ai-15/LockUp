"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Check, Zap, Shield, Building2, Star, ArrowRight, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Shield,
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For indie devs and open-source projects",
    badge: null,
    color: "border-border",
    buttonVariant: "outline" as const,
    buttonText: "Get Started Free",
    features: [
      "5 scans / month",
      "SAST + DAST scanning",
      "1 asset (repo, website, or contract)",
      "Vulnerability report (PDF export)",
      "Community support",
      "OWASP Top 10 coverage",
    ],
    notIncluded: [
      "AI auto-fix",
      "Agent swarm",
      "Blockchain analysis",
      "Shadow AI detection",
      "API integrations",
      "SLA",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    monthlyPrice: 79,
    annualPrice: 59,
    description: "For teams building production apps",
    badge: "Most Popular",
    color: "border-primary/50 shadow-lg shadow-primary/10",
    buttonVariant: "default" as const,
    buttonText: "Start Pro Trial",
    features: [
      "Unlimited scans",
      "SAST + DAST + SCA + Blockchain",
      "10 assets",
      "AI auto-fix with PR generation",
      "4-agent security swarm",
      "Shadow AI detection",
      "GitHub + Slack integrations",
      "Runtime monitoring",
      "CVSS v3.1 scoring",
      "OWASP + API Top 10 + AI/LLM rules",
      "Email support (48h SLA)",
    ],
    notIncluded: [
      "Custom agents",
      "SSO / SAML",
      "Dedicated support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    monthlyPrice: 299,
    annualPrice: 239,
    description: "For security-first engineering orgs",
    badge: "Full Coverage",
    color: "border-accent/40",
    buttonVariant: "outline" as const,
    buttonText: "Contact Sales",
    features: [
      "Everything in Pro",
      "Unlimited assets",
      "Custom AI agent builder",
      "Multi-chain blockchain analysis",
      "SBOM generation (CycloneDX/SPDX)",
      "Formal verification (Hoare Logic)",
      "Supply chain monitoring",
      "SSO / SAML / SCIM",
      "Jira + PagerDuty integrations",
      "Audit logs + compliance reports",
      "SOC 2 Type II ready",
      "Dedicated security engineer",
      "4-hour critical SLA",
    ],
    notIncluded: [],
  },
]

const faqs = [
  { q: "What is a 'scan'?", a: "A scan is one full security analysis of a target — a URL, GitHub repo, or smart contract address. Scans run SAST, DAST, SCA, and blockchain checks depending on your plan." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings > Billing at any time. You keep access until the end of the billing period. No cancellation fees." },
  { q: "What is AI Auto-Fix?", a: "When a vulnerability is found, our Fix Agent generates a production-ready code patch and optionally opens a Pull Request in your repo with tests that prove the fix works." },
  { q: "Is Shadow AI detection available on Free?", a: "No — Shadow AI detection (identifying vibe-coded, AI-generated insecure patterns) is a Pro and Enterprise feature." },
  { q: "Do you support private repos?", a: "Yes. Install the LockUp GitHub App and grant access to any private repository. We never store your source code — scans run ephemerally." },
  { q: "What compliance standards do you cover?", a: "Enterprise includes pre-built report templates for SOC 2, PCI-DSS, OWASP ASVS, NIST CSF, and ISO 27001." },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className="flex flex-col gap-12 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center flex flex-col gap-4"
      >
        <Badge variant="outline" className="w-fit mx-auto border-primary/30 text-primary text-xs">
          <Lock className="h-3 w-3 mr-1" />
          Security-first pricing
        </Badge>
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          Protect everything you build.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          AI-powered vulnerability scanning, auto-fix, and agent swarm for every type of digital asset.
          Start free — no credit card required.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <Label className="text-sm text-muted-foreground">Monthly</Label>
          <Switch
            checked={annual}
            onCheckedChange={setAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <Label className="text-sm text-foreground">
            Annual
            <Badge variant="outline" className="ml-2 border-success/30 text-success text-[10px]">
              Save 25%
            </Badge>
          </Label>
        </div>
      </motion.div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, i) => {
          const Icon = plan.icon
          const price = annual ? plan.annualPrice : plan.monthlyPrice
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`bg-card border-2 ${plan.color} h-full flex flex-col relative overflow-hidden`}>
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className={`text-[10px] ${plan.id === "pro" ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent border-accent/30"}`}>
                      {plan.id === "pro" && <Star className="h-2.5 w-2.5 mr-1" />}
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${plan.id === "pro" ? "bg-primary/15" : plan.id === "enterprise" ? "bg-accent/15" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${plan.id === "pro" ? "text-primary" : plan.id === "enterprise" ? "text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{plan.name}</p>
                  </div>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-foreground">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground text-sm mb-1">/mo</span>
                    )}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Billed annually · ${price * 12}/yr
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 flex-1">
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full gap-2 ${plan.id === "pro" ? "bg-primary text-primary-foreground hover:bg-primary/90" : plan.id === "enterprise" ? "border-accent/30 text-accent hover:bg-accent/10" : "border-border text-foreground hover:bg-secondary"}`}
                    onClick={() => {
                      if (plan.id === "free") toast.success("Signed up for Free plan!")
                      else if (plan.id === "pro") toast.success("Pro trial started!", { description: "14-day free trial — no credit card required." })
                      else toast.info("Sales team will contact you within 24 hours.")
                    }}
                  >
                    {plan.buttonText}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-col gap-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.id === "pro" ? "text-primary" : plan.id === "enterprise" ? "text-accent" : "text-success"}`} />
                        <span className="text-foreground/90">{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm opacity-40">
                        <span className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center text-muted-foreground text-lg leading-none">−</span>
                        <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Trust bar */}
      <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground border border-border rounded-xl p-5 bg-card">
        {[
          "No source code stored — ephemeral scans",
          "SOC 2 Type II (Enterprise)",
          "14-day free trial on Pro",
          "Cancel anytime",
          "GDPR compliant",
          "99.9% uptime SLA (Enterprise)",
        ].map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-success" />
            {t}
          </span>
        ))}
      </div>

      {/* FAQ */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.q} className="bg-card border-border">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-1">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
