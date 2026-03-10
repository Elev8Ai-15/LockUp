# LockUp

A modern, AI-powered security vulnerability scanner for websites, APIs, repositories, and smart contracts. Built with Next.js 16, React 19, and TypeScript.

## Features

### Multi-Target Scanning
- **Website Scanner** - HTTP security headers, TLS/SSL, CORS, cookies, exposed files, tech stack detection
- **Repository Scanner** - Secret detection, dependency vulnerabilities via OSV.dev, security file checks
- **API Scanner** - GraphQL introspection, Swagger/OpenAPI exposure, debug endpoints, JWT vulnerabilities
- **Smart Contract Scanner** - Solidity static analysis for reentrancy, tx.origin, integer overflow

### Stack-Aware Remediation
LockUp detects your tech stack (Next.js, Express, Django, Rails, Laravel, WordPress, Netlify, Vercel, etc.) and generates **deployable fix code** specific to your environment:

- `next.config.mjs` headers for Next.js
- `_headers` file format for Netlify/static sites
- `vercel.json` headers array for Vercel
- `helmet()` middleware for Express
- `.htaccess` directives for Apache
- `settings.py` SECURE_* vars for Django
- `SecureHeaders` initializer for Rails

### Export Fixes
Select vulnerabilities and export them as JSON for easy import into your development workflow or CI/CD pipeline.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Elev8Ai-15/LockUp.git
cd LockUp

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

No environment variables are required for basic scanning. Optional:

```env
# For enhanced smart contract scanning
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Project Structure

```
├── app/
│   ├── api/scan/          # API routes for scanning
│   │   ├── website/       # Website security scanner
│   │   ├── repo/          # Repository scanner
│   │   ├── api/           # API endpoint scanner
│   │   └── contract/      # Smart contract scanner
│   ├── scans/             # Main scanning interface
│   ├── reports/           # Security reports
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard-layout.tsx
│   ├── app-sidebar.tsx
│   └── top-navbar.tsx
├── lib/
│   ├── scanner/           # Scanner modules
│   │   ├── web-scanner.ts
│   │   ├── repo-scanner.ts
│   │   ├── api-scanner.ts
│   │   ├── smart-contract-scanner.ts
│   │   ├── scoring.ts     # CVSS scoring
│   │   └── remediation.ts # Stack-aware fixes
│   └── types.ts           # TypeScript interfaces
```

## Security Checks

### Website Scanner
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- TLS/SSL configuration
- CORS misconfiguration
- Cookie security flags (HttpOnly, Secure, SameSite)
- Exposed sensitive files (.env, .git, wp-config.php, etc.)

### Repository Scanner
- Hardcoded secrets (API keys, tokens, passwords)
- Known CVEs in dependencies (via OSV.dev)
- Missing security files (.gitignore, SECURITY.md)

### API Scanner
- GraphQL introspection enabled
- Swagger/OpenAPI documentation exposed
- Debug endpoints (/debug, /trace, /phpinfo)
- Rate limiting absence
- JWT algorithm vulnerabilities (alg:none)

### Smart Contract Scanner
- Reentrancy vulnerabilities
- tx.origin authentication
- Integer overflow/underflow
- Unprotected selfdestruct
- Unchecked external calls

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Animation**: Motion (Framer Motion)
- **Charts**: Recharts
- **Testing**: Vitest, Playwright
- **Type Safety**: TypeScript 5

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run unit tests
pnpm test:e2e     # Run Playwright E2E tests
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Elev8Ai-15/LockUp)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private. Contact the maintainers for licensing inquiries.

## Acknowledgments

- Built for the AI + On-Chain + Web Era
- Powered by 28 OSS security tools
- 96% Auto-Fix Rate
