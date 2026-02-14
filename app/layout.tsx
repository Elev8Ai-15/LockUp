/* Next steps: Connect to Temporal backend for real agents + DAST integration */
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DashboardLayout } from '@/components/dashboard-layout'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'AppScan.dev - Agentic AI Security for Vibe-Coded Apps',
  description: 'The agentic AI security platform for vibe-coded apps, websites, web/mobile apps, and blockchain smart contracts. Powered by 28 OSS tools + 4 Agentic LLMs.',
  generator: 'AppScan.dev',
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background" suppressHydrationWarning>
        <DashboardLayout>
          {children}
        </DashboardLayout>
        <Analytics />
      </body>
    </html>
  )
}
