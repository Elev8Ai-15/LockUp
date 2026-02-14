"use client"

import { useState } from "react"
import { Plus, Search, Star, ExternalLink, GitBranch } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { repositories, type RepoType } from "@/lib/mock-data"
import { toast } from "sonner"

const typeColors: Record<RepoType, string> = {
  Web: "border-primary/30 text-primary",
  AI: "border-warning/30 text-warning",
  Blockchain: "border-accent/30 text-accent",
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

export default function RepositoriesPage() {
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)

  const filtered = repositories.filter((r) => {
    const matchesType = filter === "all" || r.type === filter
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">{repositories.length} repositories connected</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Repository
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-border text-foreground">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Web">Web</SelectItem>
            <SelectItem value="AI">AI</SelectItem>
            <SelectItem value="Blockchain">Blockchain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((repo, i) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">{repo.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${typeColors[repo.type]}`}>
                      {repo.type}
                    </Badge>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3" />
                          <span className="text-xs">{repo.stars}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-border">
                        {repo.stars} stars
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">{repo.language}</span>
                  <span className="text-xs text-muted-foreground">Last scan: {repo.lastScan}</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Security Score</span>
                    <span className={`text-sm font-bold ${scoreColor(repo.securityScore)}`}>
                      {repo.securityScore > 0 ? `${repo.securityScore}%` : "N/A"}
                    </span>
                  </div>
                  <Progress
                    value={repo.securityScore}
                    className={`h-1.5 bg-secondary ${progressColor(repo.securityScore)}`}
                  />
                </div>

                <div className="flex gap-2">
                  {repo.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border text-foreground hover:bg-secondary text-xs gap-1"
                      onClick={() => toast.success(`Scan queued for ${repo.name}`)}
                    >
                      Scan Now
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1"
                      onClick={() => toast.success(`${repo.name} connected!`)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Repository</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Connect a repository via GitHub OAuth to start scanning.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <Input
              placeholder="Owner/repository-name"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex flex-col gap-2">
              <Button
                className="gap-2 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => {
                  setAddOpen(false)
                  toast.success("Repository added successfully!")
                }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Authorize with GitHub
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-border text-foreground hover:bg-secondary"
                onClick={() => {
                  setAddOpen(false)
                  toast.success("Repository added successfully!")
                }}
              >
                <GitBranch className="h-4 w-4" />
                Authorize with GitLab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
