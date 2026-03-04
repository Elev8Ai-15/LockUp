import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { DashboardLayout } from '@/components/dashboard-layout'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'LockUp — Agentic AI Security',
    template: '%s | LockUp',
  },
  description: 'The agentic AI security platform for vibe-coded apps, websites, web/mobile apps, and blockchain smart contracts. Powered by 28 OSS tools + 4 Agentic LLMs.',
  generator: 'LockUp',
  applicationName: 'LockUp',
  keywords: ['security', 'AI', 'SAST', 'DAST', 'blockchain', 'smart contracts', 'vulnerability scanning', 'agentic AI'],
  authors: [{ name: 'LockUp' }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    type: 'website',
    title: 'LockUp — Agentic AI Security',
    description: 'AI-powered security scanning for modern apps, websites, and smart contracts.',
    siteName: 'LockUp',
  },
  twitter: {
    card: 'summary',
    title: 'LockUp — Agentic AI Security',
    description: 'AI-powered security scanning for modern apps, websites, and smart contracts.',
  },
  other: {
    'X-Frame-Options': 'DENY',
  },
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
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-primary focus:text-primary-foreground"
        >
          Skip to main content
        </a>
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
