/* Next steps: Connect to Temporal backend for real agents + DAST integration */
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { DashboardLayout } from '@/components/dashboard-layout'
import './globals.css'

const geistSans = localFont({
  src: '../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: '../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
})

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background`} suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <DashboardLayout>
          {children}
        </DashboardLayout>
        <Analytics />
      </body>
    </html>
  )
}
