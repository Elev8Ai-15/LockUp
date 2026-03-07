import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Dynamic import with SSR disabled to prevent Radix UI hydration mismatch
const DashboardLayout = dynamic(
  () => import('@/components/dashboard-layout').then((mod) => mod.DashboardLayout),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading LockUp...</p>
        </div>
      </div>
    )
  }
)

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: 'LockUp - Agentic AI Security for Vibe-Coded Apps',
  description: 'The agentic AI security platform for vibe-coded apps, websites, web/mobile apps, and blockchain smart contracts. Powered by 28 OSS tools + 4 Agentic LLMs.',
  generator: 'LockUp',
}

export const viewport: Viewport = {
  themeColor: '#0F1A14',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background`} suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-primary focus:text-primary-foreground">Skip to main content</a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
