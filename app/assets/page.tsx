"use client"

import { useState } from "react"
import { Plus, Search, AlertTriangle, ExternalLink, GitBranch, Globe, Smartphone, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { assets, type AssetType } from "@/lib/mock-data"
import { toast } from "sonner"

const typeIcons: Record<AssetType, typeof GitBranch> = {
  Repo: GitBranch,
  Website: Globe,
  WebApp: Smartphone,
  SmartContract: Shield,
}

const typeBadgeColors: Record<AssetType, string> = {
  Repo: "border-primary/30 text-primary",
  Website: "border-success/30 text-success",
  WebApp: "border-primary/30 text-primary",
  SmartContract: "border-accent/30 text-accent",
}

function scoreColor(score: number) {
  if (score >= 90) return "text-success"
  if (score >= 75) return "text-warning"
  if (score > 0) return "text-destructive"
  return "text-muted-foreground"
}

function progressColor(score: number) {
  if (score >= 90) return "[&>div]:bg-success"
  if (score >= 75) return "[&>div]:bg-warning"
  return "[&>div]:bg-destructive"
}

function AssetCard({ asset, i }: { asset: typeof assets[0]; i: number }) {
  const Icon = typeIcons[asset.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
    >
      <Card className="bg-card border-border hover:border-primary/20 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm font-medium text-foreground truncate">{asset.name}</span>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${typeBadgeColors[asset.type]}`}>
                {asset.language}
              </Badge>
            </div>
          </div>

          {asset.shadowAI && asset.shadowAI > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 mb-3 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">AI-generated code detected ({asset.shadowAI}%)</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border-border">
                  Shadow AI Detector: {asset.shadowAI}% of code appears to be AI-generated
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Last scan: {asset.lastScan}</span>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Security Score</span>
              <span className={`text-sm font-bold ${scoreColor(asset.securityScore)}`}>
                {asset.securityScore > 0 ? `${asset.securityScore}%` : "N/A"}
              </span>
            </div>
            <Progress
              value={asset.securityScore}
              className={`h-1.5 bg-secondary ${progressColor(asset.securityScore)}`}
            />
          </div>

          <div className="flex gap-2">
            {asset.connected ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-border text-foreground hover:bg-secondary text-xs"
                onClick={() => toast.success(`Scan queued for ${asset.name}`)}
              >
                Scan Now
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1"
                onClick={() => toast.success(`${asset.name} connected!`)}
              >
                <ExternalLink className="h-3 w-3" />
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AssetsPage() {
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<"repo" | "website" | "app" | "contract">("repo")

  const filterByType = (type: AssetType) =>
    assets.filter((a) => a.type === type && a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">{assets.length} assets connected</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Connect Asset
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="repos" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="repos" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Repos
          </TabsTrigger>
          <TabsTrigger value="websites" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Websites
          </TabsTrigger>
          <TabsTrigger value="apps" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            {"Web & Mobile Apps"}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Smart Contracts
          </TabsTrigger>
        </TabsList>

        {(["repos", "websites", "apps", "contracts"] as const).map((tab) => {
          const typeMap: Record<string, AssetType> = {
            repos: "Repo",
            websites: "Website",
            apps: "WebApp",
            contracts: "SmartContract",
          }
          const filtered = filterByType(typeMap[tab])
          return (
            <TabsContent key={tab} value={tab}>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((asset, i) => (
                    <AssetCard key={asset.id} asset={asset} i={i} />
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No {tab} found matching your search.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Connect New Asset</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a repository, website, app, or smart contract to start scanning.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="repo" onValueChange={(v) => setAddType(v as typeof addType)}>
            <TabsList className="w-full bg-secondary border border-border">
              <TabsTrigger value="repo" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Repo</TabsTrigger>
              <TabsTrigger value="website" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Website</TabsTrigger>
              <TabsTrigger value="app" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">App</TabsTrigger>
              <TabsTrigger value="contract" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">Contract</TabsTrigger>
            </TabsList>
            <TabsContent value="repo" className="flex flex-col gap-3 pt-2">
              <Input placeholder="owner/repository-name" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90" onClick={() => { setAddOpen(false); toast.success("Repository connected!") }}>
                Authorize with GitHub
              </Button>
              <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary" onClick={() => { setAddOpen(false); toast.success("Repository connected!") }}>
                <GitBranch className="h-4 w-4" />
                Authorize with GitLab
              </Button>
            </TabsContent>
            <TabsContent value="website" className="flex flex-col gap-3 pt-2">
              <Input placeholder="https://yoursite.com" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono" />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setAddOpen(false); toast.success("Website added!") }}>
                Add Website
              </Button>
            </TabsContent>
            <TabsContent value="app" className="flex flex-col gap-3 pt-2">
              <Input placeholder="https://app.example.com" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono" />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setAddOpen(false); toast.success("App added!") }}>
                Add Web/Mobile App
              </Button>
            </TabsContent>
            <TabsContent value="contract" className="flex flex-col gap-3 pt-2">
              <Input placeholder="0x... contract address" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono" />
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { setAddOpen(false); toast.success("Contract added!") }}>
                <Shield className="h-4 w-4 mr-2" />
                Add Contract
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
