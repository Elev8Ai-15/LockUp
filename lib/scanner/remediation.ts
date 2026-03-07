/* ════════════════════════════════════════════════════════════
   Remediation Database - Fix guidance for every finding type
   ════════════════════════════════════════════════════════════ */

import type { RemediationStep } from "@/lib/types"

export const remediations: Record<string, RemediationStep> = {
  /* ── Security Headers ─────────────────────────────────────── */
  "missing-csp": {
    title: "Add Content-Security-Policy Header",
    description: "CSP prevents XSS attacks by controlling which resources can be loaded. Without it, attackers can inject malicious scripts.",
    code: `// Next.js - next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
  }
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};

// Express.js
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
  },
  
  "missing-hsts": {
    title: "Enable HTTP Strict Transport Security",
    description: "HSTS forces browsers to only connect via HTTPS, preventing downgrade attacks and cookie hijacking.",
    code: `// Add header
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Express.js
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"
  },

  "missing-x-frame-options": {
    title: "Add X-Frame-Options Header",
    description: "Prevents clickjacking attacks by controlling whether the page can be embedded in iframes.",
    code: `X-Frame-Options: DENY
// or
X-Frame-Options: SAMEORIGIN`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"
  },

  "missing-x-content-type-options": {
    title: "Add X-Content-Type-Options Header",
    description: "Prevents MIME type sniffing attacks that could lead to XSS.",
    code: `X-Content-Type-Options: nosniff`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"
  },

  "missing-referrer-policy": {
    title: "Add Referrer-Policy Header",
    description: "Controls how much referrer information is sent with requests, preventing data leakage.",
    code: `// Recommended: Don't send referrer to other origins
Referrer-Policy: strict-origin-when-cross-origin

// Or more strict
Referrer-Policy: no-referrer`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy"
  },

  "missing-permissions-policy": {
    title: "Add Permissions-Policy Header",
    description: "Controls which browser features can be used, reducing attack surface.",
    code: `// Disable unnecessary features
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

// Express.js
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"
  },

  /* ── TLS/SSL Issues ───────────────────────────────────────── */
  "weak-tls": {
    title: "Upgrade to TLS 1.2 or Higher",
    description: "TLS 1.0 and 1.1 have known vulnerabilities (POODLE, BEAST). Modern browsers require TLS 1.2+.",
    code: `# Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;

# Apache
SSLProtocol -all +TLSv1.2 +TLSv1.3`,
    reference: "https://ssl-config.mozilla.org/"
  },

  "expired-cert": {
    title: "Renew SSL/TLS Certificate",
    description: "Expired certificates cause browser warnings and break HTTPS trust.",
    code: `# Let's Encrypt renewal
sudo certbot renew --dry-run
sudo certbot renew

# Set up auto-renewal
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet`,
    reference: "https://letsencrypt.org/docs/renewal/"
  },

  /* ── Exposed Files ────────────────────────────────────────── */
  "exposed-env": {
    title: "Block Access to .env Files",
    description: "Environment files contain secrets like API keys and database passwords. They must never be publicly accessible.",
    code: `# Nginx
location ~ /\\.env {
    deny all;
    return 404;
}

# Apache (.htaccess)
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# Vercel (vercel.json)
{
  "routes": [
    { "src": "/.env.*", "status": 404 }
  ]
}`,
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },

  "exposed-git": {
    title: "Block Access to .git Directory",
    description: "Exposed .git allows attackers to download your entire source code including commit history and secrets.",
    code: `# Nginx
location ~ /\\.git {
    deny all;
    return 404;
}

# Apache
<DirectoryMatch "^\\.git">
    Order allow,deny
    Deny from all
</DirectoryMatch>`,
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },

  /* ── CORS Issues ──────────────────────────────────────────── */
  "cors-wildcard": {
    title: "Restrict CORS to Specific Origins",
    description: "Wildcard CORS allows any website to make authenticated requests to your API, enabling data theft.",
    code: `// BEFORE (vulnerable)
app.use(cors({ origin: '*' }));

// AFTER (secure)
const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));`,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
  },

  /* ── Cookie Security ──────────────────────────────────────── */
  "insecure-cookie": {
    title: "Set Secure Cookie Flags",
    description: "Cookies without Secure, HttpOnly, and SameSite flags can be stolen via XSS or transmitted over HTTP.",
    code: `// Express.js session
app.use(session({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Manual cookie
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});`,
    reference: "https://owasp.org/www-community/controls/SecureCookieAttribute"
  },

  /* ── Server Disclosure ────────────────────────────────────── */
  "server-disclosure": {
    title: "Remove Server Version Headers",
    description: "Server headers reveal technology stack, helping attackers find version-specific exploits.",
    code: `# Nginx
server_tokens off;

# Apache
ServerTokens Prod
ServerSignature Off

# Express.js
app.disable('x-powered-by');`,
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },

  /* ── Smart Contract Vulnerabilities ───────────────────────── */
  "reentrancy": {
    title: "Implement Checks-Effects-Interactions Pattern",
    description: "Reentrancy allows attackers to drain funds by recursively calling back into the contract before state updates.",
    code: `// BEFORE (vulnerable)
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount; // State update AFTER external call
}

// AFTER (secure) - Use ReentrancyGuard + CEI pattern
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function withdraw(uint256 amount) external nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State update BEFORE external call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    emit Withdrawn(msg.sender, amount);
}`,
    reference: "https://swcregistry.io/docs/SWC-107"
  },

  "tx-origin": {
    title: "Replace tx.origin with msg.sender",
    description: "tx.origin can be spoofed via phishing contracts, allowing unauthorized access.",
    code: `// BEFORE (vulnerable)
require(tx.origin == owner);

// AFTER (secure)
require(msg.sender == owner);`,
    reference: "https://swcregistry.io/docs/SWC-115"
  },

  "integer-overflow": {
    title: "Use Solidity 0.8+ or SafeMath",
    description: "Integer overflow can corrupt token balances or bypass checks.",
    code: `// Option 1: Use Solidity 0.8+ (auto-reverts on overflow)
pragma solidity ^0.8.0;
uint256 total = balance + amount; // Auto-reverts if overflow

// Option 2: For older Solidity, use SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
using SafeMath for uint256;
uint256 total = balance.add(amount);`,
    reference: "https://swcregistry.io/docs/SWC-101"
  },

  "unchecked-call": {
    title: "Check Return Values of External Calls",
    description: "Unchecked call return values can silently fail, leading to inconsistent state.",
    code: `// BEFORE (vulnerable)
address(target).call{value: amount}("");

// AFTER (secure)
(bool success, ) = address(target).call{value: amount}("");
require(success, "Transfer failed");`,
    reference: "https://swcregistry.io/docs/SWC-104"
  },

  /* ── Repository Vulnerabilities ───────────────────────────── */
  "hardcoded-secret": {
    title: "Move Secrets to Environment Variables",
    description: "Hardcoded secrets in source code can be stolen from version history even after deletion.",
    code: `// BEFORE (vulnerable)
const API_KEY = "sk-live-abc123";

// AFTER (secure)
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY required");

// .gitignore
.env
.env.local
.env.production`,
    reference: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password"
  },

  "outdated-dependency": {
    title: "Update Vulnerable Dependencies",
    description: "Known CVEs in dependencies can be exploited to compromise your application.",
    code: `# Check for vulnerabilities
npm audit
pnpm audit

# Auto-fix where possible
npm audit fix
pnpm audit --fix

# Update specific package
npm update lodash
pnpm update lodash`,
    reference: "https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities"
  },

  /* ── API Vulnerabilities ──────────────────────────────────── */
  "graphql-introspection": {
    title: "Disable GraphQL Introspection in Production",
    description: "Introspection exposes your entire API schema, helping attackers discover attack vectors.",
    code: `// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});

// Yoga
const yoga = createYoga({
  schema,
  graphiql: process.env.NODE_ENV !== 'production'
});`,
    reference: "https://www.apollographql.com/blog/graphql/security/why-you-should-disable-graphql-introspection-in-production/"
  },

  "jwt-none": {
    title: "Validate JWT Algorithm",
    description: "alg:none vulnerability allows attackers to forge tokens without a signature.",
    code: `// BEFORE (vulnerable)
const decoded = jwt.decode(token);

// AFTER (secure) - Always verify with explicit algorithm
const decoded = jwt.verify(token, secretKey, {
  algorithms: ['HS256'] // Explicitly allow only expected algorithms
});`,
    reference: "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/"
  },

  "missing-rate-limit": {
    title: "Implement Rate Limiting",
    description: "Without rate limiting, attackers can brute-force credentials or overwhelm your API.",
    code: `// Express.js with express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5 // 5 attempts per hour
});

app.post('/api/login', authLimiter, loginHandler);`,
    reference: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html"
  },

  /* ── Missing Security Files ───────────────────────────────── */
  "missing-gitignore": {
    title: "Add .gitignore File",
    description: "Without .gitignore, sensitive files like .env, node_modules, and IDE configs may be accidentally committed.",
    code: `# Create .gitignore with common exclusions
# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.production

# Build
dist/
build/
.next/

# IDE
.idea/
.vscode/
*.swp`,
    reference: "https://github.com/github/gitignore"
  },

  "missing-security-txt": {
    title: "Add security.txt File",
    description: "security.txt helps security researchers know how to report vulnerabilities responsibly.",
    code: `# Create /.well-known/security.txt
Contact: mailto:security@yourdomain.com
Expires: 2025-12-31T23:59:00.000Z
Preferred-Languages: en
Canonical: https://yourdomain.com/.well-known/security.txt`,
    reference: "https://securitytxt.org/"
  },

  "exposed-swagger": {
    title: "Protect API Documentation",
    description: "Public API documentation reveals endpoints and parameters that attackers can exploit.",
    code: `// Protect swagger in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api-docs', requireAuth);
  app.use('/swagger', requireAuth);
}`,
    reference: "https://swagger.io/docs/specification/authentication/"
  },

  /* ── DNS/Email Security ───────────────────────────────────── */
  "missing-spf": {
    title: "Add SPF DNS Record",
    description: "SPF prevents email spoofing by specifying which servers can send email for your domain.",
    code: `# Add TXT record to DNS
v=spf1 include:_spf.google.com include:sendgrid.net ~all

# Strict version (hard fail)
v=spf1 include:_spf.google.com -all`,
    reference: "https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/"
  },

  "missing-dmarc": {
    title: "Add DMARC DNS Record",
    description: "DMARC builds on SPF and DKIM to prevent email spoofing and phishing.",
    code: `# Add TXT record for _dmarc.yourdomain.com
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100

# Strict policy (reject)
v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com`,
    reference: "https://dmarc.org/overview/"
  },

  /* ── Default fallback ─────────────────────────────────────── */
  "default": {
    title: "Review and Remediate",
    description: "Review the finding details and apply appropriate security controls based on your specific environment.",
    code: "// See finding details for specific remediation steps",
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  }
}

export function getRemediation(findingType: string): RemediationStep {
  return remediations[findingType] || remediations["default"]
}
