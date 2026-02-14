"use client"

import { Eye, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { recentScans, type ScanStatus, type AssetType } from "@/lib/mock-data"
import { toast } from "sonner"

function StatusBadge({ status }: { status: ScanStatus }) {
  const styles: Record<ScanStatus, string> = {
    completed: "bg-success/15 text-success border-success/30",
    running: "bg-primary/15 text-primary border-primary/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    queued: "bg-warning/15 text-warning border-warning/30",
  }
  return (
    <Badge variant="outline" className={styles[status]}>
      {status === "running" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
      {status}
    </Badge>
  )
}

const typeColors: Record<AssetType, string> = {
  Repo: "border-primary/30 text-primary",
  Website: "border-success/30 text-success",
  WebApp: "border-primary/30 text-primary",
  SmartContract: "border-accent/30 text-accent",
}

export function RecentScansTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-foreground text-base">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Asset</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Time</TableHead>
              <TableHead className="text-muted-foreground">Vulns</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentScans.map((scan) => (
              <TableRow key={scan.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{scan.asset}</span>
                    {scan.autoFixed && (
                      <Badge variant="outline" className="border-success/30 text-success text-[9px]">Auto-Fix Applied</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className={`text-[10px] ${typeColors[scan.assetType]}`}>
                    {scan.assetType}
                  </Badge>
                </TableCell>
                <TableCell><StatusBadge status={scan.status} /></TableCell>
                <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{scan.time}</TableCell>
                <TableCell>
                  <span className={scan.vulns > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {scan.vulns}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">View Report</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => toast.success(`Re-scan queued for ${scan.asset}`)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">Re-scan</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
