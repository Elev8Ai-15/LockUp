"use client"

import { useState } from "react"
import { Save, Key, Bell, Shield, Webhook, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    critical: true,
    high: true,
    medium: false,
    slack: true,
    email: true,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, integrations, and scan preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">General</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Integrations</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">General Settings</CardTitle>
              <CardDescription className="text-muted-foreground">Configure scanning preferences and defaults.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Default Scan Depth</Label>
                  <Select defaultValue="deep">
                    <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="quick">Quick Scan</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deep">Deep Scan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Auto-scan on Push</Label>
                  <Select defaultValue="enabled">
                    <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="main-only">Main Branch Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">AI-Powered Auto-Fix</p>
                  <p className="text-xs text-muted-foreground">Let agents automatically generate and apply fixes</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Shadow AI Detection</p>
                  <p className="text-xs text-muted-foreground">Flag AI-generated code across all asset types</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-warning" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Blockchain Analysis</p>
                  <p className="text-xs text-muted-foreground">Enable Slither, Mythril, and formal verification for Solidity</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-accent" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Website DAST Scanning</p>
                  <p className="text-xs text-muted-foreground">Enable OWASP ZAP and Nuclei for web assets</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-success" />
              </div>
              <Button className="w-fit gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Settings saved!")}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Notification Preferences</CardTitle>
              <CardDescription className="text-muted-foreground">Choose which alerts you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                { key: "critical", label: "Critical Vulnerabilities", desc: "CVSS 9.0+" },
                { key: "high", label: "High Vulnerabilities", desc: "CVSS 7.0-8.9" },
                { key: "medium", label: "Medium Vulnerabilities", desc: "CVSS 4.0-6.9" },
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
                <Switch checked={notifications.slack} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, slack: checked }))} className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Digests</p>
                  <p className="text-xs text-muted-foreground">Receive daily summary emails</p>
                </div>
                <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))} className="data-[state=checked]:bg-primary" />
              </div>
              <Button className="w-fit gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Notification preferences saved!")}>
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2"><Webhook className="h-4 w-4 text-primary" />Integrations</CardTitle>
              <CardDescription className="text-muted-foreground">Connect third-party services to enhance your workflow.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                { name: "GitHub", status: "Connected", account: "dev-sec-org" },
                { name: "Slack", status: "Connected", account: "#security-alerts" },
                { name: "Jira", status: "Not Connected", account: null },
                { name: "PagerDuty", status: "Not Connected", account: null },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.account || "Click connect to set up"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={integration.status === "Connected" ? "outline" : "default"}
                    className={integration.status === "Connected" ? "border-success/30 text-success hover:bg-success/10" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                    onClick={() => toast.success(integration.status === "Connected" ? `${integration.name} disconnected` : `${integration.name} connected!`)}
                  >
                    {integration.status === "Connected" ? "Connected" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Security & API Keys</CardTitle>
              <CardDescription className="text-muted-foreground">Manage API keys and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">API Key</Label>
                <div className="flex gap-2">
                  <Input value="sk-appscan-xxxx-xxxx-xxxx-xxxxxxxxxxxx" readOnly className="bg-secondary border-border text-muted-foreground font-mono" />
                  <Button variant="outline" className="border-border text-foreground hover:bg-secondary shrink-0" onClick={() => { navigator.clipboard.writeText("sk-appscan-xxxx-xxxx-xxxx-xxxxxxxxxxxx").then(() => toast.success("API key copied!")).catch(() => toast.error("Failed to copy")) }}>
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => toast.error("Account deletion cancelled", { description: "This is a demo." })}>
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
