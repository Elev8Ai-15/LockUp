/* ════════════════════════════════════════════════════════════
   Mock Data - Bridge between legacy and new scanner system
   ════════════════════════════════════════════════════════════ */

// Re-export everything from legacy for backward compatibility
export * from "./mock-data.legacy"

// Also export new types
export type { 
  Finding, 
  ScanResult, 
  ScanOptions, 
  ScanReport,
  ScanProgress,
  RemediationStep,
  OWASPCategory,
  ScanType,
} from "./types"
