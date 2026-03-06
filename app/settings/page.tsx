"use client"

import { useState, useEffect } from "react"
import { 
  Save, Key, Bell, Shield, Webhook, Trash2, 
  ExternalLink, CheckCircle2, XCircle, AlertCircle,
  Zap, TestTube, Database, Lock, Eye, EyeOff, Copy, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

/* ── Environment Variable Configuration ─────────────────────── */
interface EnvVarConfig {
  key: string
  name: string
  description: string
  required: boolean
  docsUrl: string
  freeLimit?: string
}

const requiredEnvVars: EnvVarConfig[] = [
  {
    key: "ETHERSCAN_API_KEY",
    name: "Etherscan API Key",
    description: "Required for smart contract source code fetching and analysis",
    required: false,
    docsUrl: "https://etherscan.io/apis",
    freeLimit: "5 calls/sec, 100k/day",
  },
  {
    key: "VIRUSTOTAL_API_KEY",
    name: "VirusTotal API Key",
    description: "Optional: Enhanced malware and URL scanning",
    required: false,
    docsUrl: "https://www.virustotal.com/gui/my-apikey",
    freeLimit: "500 requests/day",
  },
]

/* ── Component ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    critical: true,
    high: true,
    medium: false,
    slack: true,
    email: true,
  })
  
  const [demoMode, setDemoMode] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [envVarStatus, setEnvVarStatus] = useState<Record<string, boolean>>({})
  
  // Check env var status on mount
  useEffect(() => {
    // In a real app, this would call an API to check which env vars are set
    // For demo, we'll simulate checking
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/scan/contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: "0x0000000000000000000000000000000000000000" }),
        })
        // If we get a response, the API is working
        setEnvVarStatus(prev => ({ ...prev, ETHERSCAN_API_KEY: response.ok }))
      } catch {
        setEnvVarStatus(prev => ({ ...prev, ETHERSCAN_API_KEY: false }))
      }
    }
    checkEnvVars()
  }, [])

  const copyApiKey = () => {
    navigator.clipboard.writeText("sk-lockup-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
    setCopiedKey(true)
    toast.success("API key copied!")
    setTimeout(() => setCopiedKey(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure scanner engines, API keys, and preferences.
        </p>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="scanner" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Key className="h-3.5 w-3.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Webhook className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* ── Scanner Tab ────────────────────────────────────── */}
        <TabsContent value="scanner" className="mt-4">
          {/* Demo Mode Card */}
          <Card className="bg-card border-primary/20 mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Scanner Mode</CardTitle>
                </div>
                <Badge variant="outline" className={demoMode 
                  ? "border-warning/30 text-warning" 
                  : "border-success/30 text-success"
                }>
                  {demoMode ? "Demo Mode" : "Production"}
                </Badge>
              </div>
              <CardDescription className="text-muted-foreground">
                Toggle between real security scanning and demo data for testing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Demo Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {demoMode 
                      ? "Using mock data - no real scans performed" 
                      : "Real scanning enabled - API calls to external services"}
                  </p>
                </div>
                <Switch 
                  checked={demoMode} 
                  onCheckedChange={(checked) => {
                    setDemoMode(checked)
                    toast.success(checked ? "Demo mode enabled" : "Production mode enabled")
                  }}
                  className="data-[state=checked]:bg-warning"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scanner Settings Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Scanner Configuration</CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure scanning behavior and analysis depth.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Default Scan Depth</Label>
                  <Select defaultValue="deep">
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="quick">Quick Scan (faster, fewer checks)</SelectItem>
                      <SelectItem value="standard">Standard (balanced)</SelectItem>
                      <SelectItem value="deep">Deep Scan (thorough, slower)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Request Timeout</Label>
                  <Select defaultValue="10">
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds (recommended)</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator className="bg-border" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Website Security Scanning</p>
                    <p className="text-xs text-muted-foreground">Headers, TLS, CORS, sensitive files</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-success" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Repository Scanning</p>
                    <p className="text-xs text-muted-foreground">Secrets, dependencies, security config</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Smart Contract Analysis</p>
                    <p className="text-xs text-muted-foreground">Reentrancy, access control, compiler issues</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">API Security Scanning</p>
                    <p className="text-xs text-muted-foreground">GraphQL, OpenAPI, debug endpoints, JWT</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-warning" />
                </div>
              </div>
              
              <Button 
                className="w-fit gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={() => toast.success("Scanner settings saved!")}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API Keys Tab ───────────────────────────────────── */}
        <TabsContent value="api-keys" className="mt-4">
          <Card className="bg-card border-border mb-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <CardTitle className="text-foreground">External API Keys</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Configure API keys for enhanced scanning capabilities. All services have free tiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredEnvVars.map((envVar) => (
                <div 
                  key={envVar.key} 
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{envVar.name}</p>
                      {envVarStatus[envVar.key] ? (
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-warning/30 text-warning gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Not Set
                        </Badge>
                      )}
                      {envVar.required && (
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{envVar.description}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded text-muted-foreground">
                        {envVar.key}
                      </code>
                      {envVar.freeLimit && (
                        <span className="text-[10px] text-muted-foreground">
                          Free: {envVar.freeLimit}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 ml-4"
                    onClick={() => window.open(envVar.docsUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Get Key
                  </Button>
                </div>
              ))}
              
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">How to configure API keys</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Add environment variables to your deployment (Vercel, etc.) or create a{" "}
                      <code className="text-[10px] font-mono bg-background px-1 rounded">.env.local</code>{" "}
                      file in your project root. The scanners will automatically use configured keys 
                      for enhanced functionality.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <CardTitle className="text-foreground">LockUp API Key</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Your API key for programmatic access to LockUp scanning services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value="sk-lockup-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    readOnly
                    type={showApiKey ? "text" : "password"}
                    className="bg-secondary border-border text-muted-foreground font-mono pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={copyApiKey}
                >
                  {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedKey ? "Copied" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ──────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose which alerts you want to receive and how.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                { key: "critical", label: "Critical Vulnerabilities", desc: "CVSS 9.0+ (e.g., reentrancy, exposed secrets)" },
                { key: "high", label: "High Vulnerabilities", desc: "CVSS 7.0-8.9 (e.g., CORS issues, missing auth)" },
                { key: "medium", label: "Medium Vulnerabilities", desc: "CVSS 4.0-6.9 (e.g., missing headers)" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
              
              <Separator className="bg-border" />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Slack Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts to your Slack workspace</p>
                </div>
                <Switch 
                  checked={notifications.slack} 
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, slack: checked }))} 
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Digests</p>
                  <p className="text-xs text-muted-foreground">Receive daily summary emails</p>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))} 
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
              
              <Button 
                className="w-fit gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={() => toast.success("Notification preferences saved!")}
              >
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrations Tab ───────────────────────────────── */}
        <TabsContent value="integrations" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                Integrations
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Connect third-party services to enhance your security workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                { name: "GitHub", status: "Connected", account: "dev-sec-org", desc: "Scan repos, create PRs" },
                { name: "Slack", status: "Connected", account: "#security-alerts", desc: "Real-time notifications" },
                { name: "Jira", status: "Not Connected", account: null, desc: "Create tickets from findings" },
                { name: "PagerDuty", status: "Not Connected", account: null, desc: "Critical alerts escalation" },
              ].map((integration) => (
                <div 
                  key={integration.name} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{integration.name}</p>
                      {integration.status === "Connected" && (
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {integration.account || integration.desc}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={integration.status === "Connected" ? "outline" : "default"}
                    className={integration.status === "Connected" 
                      ? "border-success/30 text-success hover:bg-success/10" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                    onClick={() => toast.success(
                      integration.status === "Connected" 
                        ? `${integration.name} disconnected` 
                        : `${integration.name} connected!`
                    )}
                  >
                    {integration.status === "Connected" ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Danger Zone */}
          <Card className="bg-card border-destructive/20 mt-4">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete All Scan Data</p>
                  <p className="text-xs text-muted-foreground">Permanently delete all scan history and findings</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-destructive/30 text-destructive hover:bg-destructive/10" 
                  onClick={() => toast.error("Deletion cancelled", { description: "This is a demo." })}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
