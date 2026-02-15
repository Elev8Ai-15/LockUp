"use client"

import { motion } from "motion/react"
import { Bot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { agents } from "@/lib/mock-data"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"

const statusDot: Record<string, string> = {
  active: "bg-success",
  thinking: "bg-primary",
  idle: "bg-muted-foreground",
}

export function AgentSwarm() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-foreground text-base">Live Security Swarm</CardTitle>
          <Badge variant="outline" className="border-success/30 text-success text-[10px]">4 agents active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="relative shrink-0">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${agentBgColor[agent.colorKey]}`}>
                  <Bot className={`h-4 w-4 ${agentTextColor[agent.colorKey]}`} />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusDot[agent.status]} ${agent.status === "thinking" ? "animate-pulse" : ""}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.currentTask}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
