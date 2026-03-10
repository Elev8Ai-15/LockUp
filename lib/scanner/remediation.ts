/* ════════════════════════════════════════════════════════════
   Stack-Aware Remediation Engine
   Generates fix code specific to the detected technology stack
   ════════════════════════════════════════════════════════════ */

import type { RemediationStep, DetectedStack } from "@/lib/types"

type StackType = "nextjs" | "express" | "react" | "vue" | "angular" | "wordpress" | "django" | "rails" | "laravel" | "nginx" | "apache" | "vercel" | "cloudflare" | "netlify" | "generic"

function detectStackType(stack: DetectedStack | null): StackType {
  if (!stack) return "generic"
  
  const framework = stack.framework?.toLowerCase() || ""
  const server = stack.server?.toLowerCase() || ""
  const cms = stack.cms?.toLowerCase() || ""
  const cdn = stack.cdn?.toLowerCase() || ""
  
  // Framework detection (most specific first)
  if (framework.includes("next")) return "nextjs"
  if (framework.includes("django")) return "django"
  if (framework.includes("rails") || framework.includes("ruby")) return "rails"
  if (framework.includes("laravel")) return "laravel"
  if (framework.includes("express")) return "express"
  if (framework.includes("vue") || framework.includes("nuxt")) return "vue"
  if (framework.includes("angular")) return "angular"
  if (framework.includes("react")) return "react"
  
  // CMS detection
  if (cms.includes("wordpress")) return "wordpress"
  if (cms.includes("genspark")) return "netlify" // Genspark uses static hosting
  if (cms.includes("wix") || cms.includes("squarespace") || cms.includes("webflow")) return "netlify"
  
  // CDN/Hosting detection
  if (cdn.includes("netlify")) return "netlify"
  if (cdn.includes("vercel")) return "vercel"
  if (cdn.includes("cloudflare")) return "cloudflare"
  
  // Server detection (for WordPress on Apache)
  if (server.includes("apache")) return "apache"
  if (server.includes("nginx")) return "nginx"
  
  // Static HTML sites default to netlify format (most portable)
  return "netlify"
}

/* ════════════════════════════════════════════════════════════
   Stack-Specific Code Templates
   ════════════════════════════════════════════════════════════ */

const stackSpecificCode: Record<string, Record<StackType, string>> = {
  "missing-csp": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;`,
    express: `// middleware/security.js
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"]
  }
}));

// Or manually:
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
        }
      ]
    }
  ]
}`,
    netlify: `# Create _headers file in your publish directory (or site root)
# Netlify _headers file format

/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"`,
    cloudflare: `// Cloudflare Worker or Page Rule
// Add Transform Rule in Cloudflare Dashboard:
// 1. Go to Rules > Transform Rules > Modify Response Header
// 2. Add header: Content-Security-Policy
// 3. Value: default-src 'self'; script-src 'self' 'unsafe-inline';

// Or via Cloudflare Worker:
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Security-Policy', "default-src 'self'");
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}`,
    nginx: `# nginx.conf or site config
server {
    # Add CSP header
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
}`,
    apache: `# .htaccess or httpd.conf
<IfModule mod_headers.c>
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
</IfModule>`,
    wordpress: `// Add to functions.php
function add_security_headers() {
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
}
add_action('send_headers', 'add_security_headers');

// Or use a plugin like "HTTP Headers" or "Security Headers"`,
    django: `# settings.py
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
    # ... other middleware
]

# Install django-csp: pip install django-csp
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")`,
    rails: `# config/initializers/content_security_policy.rb
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.script_src  :self, :unsafe_inline
    policy.style_src   :self, :unsafe_inline
    policy.img_src     :self, :data, :https
    policy.font_src    :self
  end
end`,
    laravel: `// app/Http/Middleware/SecurityHeaders.php
namespace App\\Http\\Middleware;

class SecurityHeaders
{
    public function handle($request, \\Closure $next)
    {
        $response = $next($request);
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        );
        return $response;
    }
}

// Register in app/Http/Kernel.php:
protected $middleware = [
    \\App\\Http\\Middleware\\SecurityHeaders::class,
];`,
    react: `// For Create React App, use CRACO or react-app-rewired
// craco.config.js
module.exports = {
  devServer: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline';"
    }
  }
};

// For production, configure your hosting platform (Vercel, Netlify, etc.)`,
    vue: `// vue.config.js
module.exports = {
  devServer: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
    }
  }
};

// For Nuxt.js - nuxt.config.js
export default {
  render: {
    csp: {
      policies: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
      }
    }
  }
}`,
    angular: `// angular.json - For development only
// For production, configure at server/CDN level

// Using nginx for Angular production:
server {
    location / {
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;
        try_files $uri $uri/ /index.html;
    }
}`,
    generic: `// Generic - Add to your web server configuration
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;

// Common deployment platforms:
// - Vercel: vercel.json headers
// - Netlify: _headers file
// - AWS CloudFront: Response headers policy`
  },

  "missing-hsts": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;`,
    express: `// Using helmet (recommended)
const helmet = require('helmet');
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));

// Or manually:
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}`,
    netlify: `# _headers file in your publish directory
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"`,
    cloudflare: `// Cloudflare Dashboard:
// SSL/TLS > Edge Certificates > Enable "Always Use HTTPS"
// SSL/TLS > Edge Certificates > Enable HSTS
// Set: Max Age = 12 months, Include subdomains, Preload`,
    nginx: `# nginx.conf
server {
    listen 443 ssl http2;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}`,
    apache: `# .htaccess or httpd.conf
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>`,
    wordpress: `// functions.php
function add_hsts_header() {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
}
add_action('send_headers', 'add_hsts_header');`,
    django: `# settings.py
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True`,
    rails: `# config/environments/production.rb
config.force_ssl = true
config.ssl_options = {
  hsts: { subdomains: true, preload: true, expires: 1.year }
}`,
    laravel: `// app/Http/Middleware/SecurityHeaders.php
$response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

// Or in .htaccess if using Apache`,
    react: `// Configure at hosting level (Vercel, Netlify, etc.)
// For Netlify - _headers file:
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
    vue: `// Configure at hosting/server level
// For Nuxt on Vercel, use vercel.json
// For Nuxt on Node, use server middleware`,
    angular: `// Configure at server level (nginx, Apache, etc.)
// Or hosting platform (Vercel, Firebase, etc.)`,
    generic: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Add this header at your web server or CDN level`
  },

  "missing-x-frame-options": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' }
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;`,
    express: `const helmet = require('helmet');
app.use(helmet.frameguard({ action: 'deny' }));

// Or manually:
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "X-Frame-Options", "value": "DENY" }]
    }
  ]
}`,
    netlify: `# _headers file
/*
  X-Frame-Options: DENY

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"`,
    cloudflare: `// Cloudflare Transform Rules
// Add response header: X-Frame-Options = DENY`,
    nginx: `add_header X-Frame-Options "DENY" always;`,
    apache: `Header always set X-Frame-Options "DENY"`,
    wordpress: `// functions.php
function add_frame_options() {
    header('X-Frame-Options: DENY');
}
add_action('send_headers', 'add_frame_options');`,
    django: `# settings.py
X_FRAME_OPTIONS = 'DENY'`,
    rails: `# config/application.rb
config.action_dispatch.default_headers['X-Frame-Options'] = 'DENY'`,
    laravel: `$response->headers->set('X-Frame-Options', 'DENY');`,
    react: `// Configure at hosting level`,
    vue: `// Configure at hosting/server level`,
    angular: `// Configure at server level`,
    generic: `X-Frame-Options: DENY`
  },

  "missing-x-content-type-options": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' }
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;`,
    express: `const helmet = require('helmet');
app.use(helmet.noSniff());

// Or manually:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "X-Content-Type-Options", "value": "nosniff" }]
    }
  ]
}`,
    netlify: `# _headers file
/*
  X-Content-Type-Options: nosniff

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"`,
    cloudflare: `// Cloudflare Transform Rules
// Add response header: X-Content-Type-Options = nosniff`,
    nginx: `add_header X-Content-Type-Options "nosniff" always;`,
    apache: `Header always set X-Content-Type-Options "nosniff"`,
    wordpress: `// functions.php
function add_content_type_options() {
    header('X-Content-Type-Options: nosniff');
}
add_action('send_headers', 'add_content_type_options');`,
    django: `# Django sets this by default when SecurityMiddleware is enabled
# settings.py
SECURE_CONTENT_TYPE_NOSNIFF = True`,
    rails: `# config/application.rb
config.action_dispatch.default_headers['X-Content-Type-Options'] = 'nosniff'`,
    laravel: `$response->headers->set('X-Content-Type-Options', 'nosniff');`,
    react: `// Configure at hosting level (Vercel, Netlify, etc.)`,
    vue: `// Configure at hosting/server level`,
    angular: `// Configure at server level`,
    generic: `X-Content-Type-Options: nosniff`
  },

  "missing-referrer-policy": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;`,
    express: `const helmet = require('helmet');
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

// Or manually:
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }]
    }
  ]
}`,
    netlify: `# _headers file
/*
  Referrer-Policy: strict-origin-when-cross-origin

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    Referrer-Policy = "strict-origin-when-cross-origin"`,
    cloudflare: `// Cloudflare Transform Rules
// Add response header: Referrer-Policy = strict-origin-when-cross-origin`,
    nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    wordpress: `// functions.php
function add_referrer_policy() {
    header('Referrer-Policy: strict-origin-when-cross-origin');
}
add_action('send_headers', 'add_referrer_policy');`,
    django: `# settings.py
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'`,
    rails: `# config/application.rb
config.action_dispatch.default_headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'`,
    laravel: `$response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');`,
    react: `// Configure at hosting level`,
    vue: `// Configure at hosting/server level`,
    angular: `// Configure at server level`,
    generic: `Referrer-Policy: strict-origin-when-cross-origin`
  },

  "missing-permissions-policy": {
    nextjs: `// next.config.mjs
const securityHeaders = [
  { 
    key: 'Permissions-Policy', 
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;`,
    express: `const helmet = require('helmet');
app.use(helmet.permittedCrossDomainPolicies());

// Manual Permissions-Policy:
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});`,
    vercel: `// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { 
          "key": "Permissions-Policy", 
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
}`,
    netlify: `# _headers file
/*
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

# Or in netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), interest-cohort=()"`,
    cloudflare: `// Cloudflare Transform Rules
// Add response header: Permissions-Policy = camera=(), microphone=(), geolocation=()`,
    nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;`,
    apache: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()"`,
    wordpress: `// functions.php
function add_permissions_policy() {
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()');
}
add_action('send_headers', 'add_permissions_policy');`,
    django: `# Use django-permissions-policy package
# pip install django-permissions-policy
PERMISSIONS_POLICY = {
    "camera": [],
    "microphone": [],
    "geolocation": [],
    "interest-cohort": [],
}`,
    rails: `# config/initializers/permissions_policy.rb
Rails.application.config.permissions_policy do |policy|
  policy.camera      :none
  policy.microphone  :none
  policy.geolocation :none
end`,
    laravel: `$response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');`,
    react: `// Configure at hosting level`,
    vue: `// Configure at hosting/server level`,
    angular: `// Configure at server level`,
    generic: `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
  },

  "cors-wildcard": {
    nextjs: `// app/api/[...route]/route.ts or middleware.ts
import { NextResponse } from 'next/server';

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

export function middleware(request) {
  const origin = request.headers.get('origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
  
  return NextResponse.next();
}`,
    express: `const cors = require('cors');

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));`,
    vercel: `// vercel.json - Note: Vercel doesn't support dynamic origin checking
// Use middleware.ts for dynamic CORS
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://yourdomain.com" },
        { "key": "Access-Control-Allow-Credentials", "value": "true" }
      ]
    }
  ]
}`,
    netlify: `# _headers file - Netlify doesn't support dynamic origin
# For static origins only:
/api/*
  Access-Control-Allow-Origin: https://yourdomain.com
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS

# For dynamic CORS, use Netlify Functions:
// netlify/functions/api.js
exports.handler = async (event) => {
  const allowedOrigins = ['https://yourdomain.com'];
  const origin = event.headers.origin;
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify({ data: 'response' })
  };
};`,
    cloudflare: `// Cloudflare Worker for dynamic CORS
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const allowedOrigins = ['https://yourdomain.com'];

async function handleRequest(request) {
  const origin = request.headers.get('Origin');
  const response = await fetch(request);
  const newHeaders = new Headers(response.headers);
  
  if (origin && allowedOrigins.includes(origin)) {
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return new Response(response.body, { headers: newHeaders });
}`,
    nginx: `# nginx.conf - Basic static CORS (use Lua module for dynamic)
location /api/ {
    if ($http_origin ~* "^https://(yourdomain\\.com|app\\.yourdomain\\.com)$") {
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials true;
    }
}`,
    apache: `# .htaccess
SetEnvIf Origin "^https://(yourdomain\\.com|app\\.yourdomain\\.com)$" CORS=$0
Header set Access-Control-Allow-Origin %{CORS}e env=CORS
Header set Access-Control-Allow-Credentials "true" env=CORS`,
    wordpress: `// functions.php
function custom_cors_headers() {
    $allowed = ['https://yourdomain.com', 'https://app.yourdomain.com'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    }
}
add_action('init', 'custom_cors_headers');`,
    django: `# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://app.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True

# Install: pip install django-cors-headers
INSTALLED_APPS = ['corsheaders', ...]
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]`,
    rails: `# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://yourdomain.com', 'https://app.yourdomain.com'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :delete, :options],
      credentials: true
  end
end`,
    laravel: `// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_origins' => [
        'https://yourdomain.com',
        'https://app.yourdomain.com'
    ],
    'supports_credentials' => true,
];`,
    react: `// Configure CORS at your backend API, not the React frontend`,
    vue: `// Configure CORS at your backend API, not the Vue frontend`,
    angular: `// Configure CORS at your backend API, not the Angular frontend`,
    generic: `// Replace wildcard (*) with specific allowed origins:
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Credentials: true`
  },

  "insecure-cookie": {
    nextjs: `// app/api/auth/route.ts
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}`,
    express: `// Using express-session
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Manual cookie:
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});`,
    vercel: `// Cookies set via API routes should use secure flags
// See Next.js example above`,
    netlify: `// Netlify Functions - secure cookie example
// netlify/functions/auth.js
exports.handler = async (event) => {
  const token = generateSessionToken();
  
  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': \`session=\${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/\`
    },
    body: JSON.stringify({ success: true })
  };
};`,
    cloudflare: `// Cloudflare Workers
const cookie = \`session=\${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/\`;
return new Response(body, {
  headers: { 'Set-Cookie': cookie }
});`,
    nginx: `# nginx.conf - Proxy cookie modification
proxy_cookie_flags ~ httponly secure samesite=strict;`,
    apache: `# .htaccess
Header edit Set-Cookie ^(.*)$ "$1; HttpOnly; Secure; SameSite=Strict"`,
    wordpress: `// functions.php - Note: WordPress session handling is different
function secure_cookies($secure, $httponly) {
    return ['secure' => true, 'httponly' => true, 'samesite' => 'Strict'];
}
add_filter('secure_signon_cookie', '__return_true');
add_filter('secure_auth_cookie', '__return_true');`,
    django: `# settings.py
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True`,
    rails: `# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_app_session',
  secure: Rails.env.production?,
  httponly: true,
  same_site: :strict`,
    laravel: `// config/session.php
return [
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'strict',
];`,
    react: `// Cookies should be set by your backend, not the React frontend
// Configure secure cookie flags on your API server`,
    vue: `// Cookies should be set by your backend, not the Vue frontend`,
    angular: `// Cookies should be set by your backend, not the Angular frontend`,
    generic: `Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
  },

  "exposed-env": {
    nextjs: `// next.config.mjs - Block .env in rewrites
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/.env:path*', destination: '/404' }
      ]
    };
  }
};

// Also add to .gitignore:
.env
.env.local
.env.production`,
    express: `// Block .env files
app.use((req, res, next) => {
  if (req.path.includes('.env')) {
    return res.status(404).send('Not found');
  }
  next();
});

// Or use static file configuration
app.use(express.static('public', {
  dotfiles: 'deny'
}));`,
    vercel: `// vercel.json
{
  "routes": [
    { "src": "/.env.*", "status": 404 },
    { "src": "/.*\\\\.env.*", "status": 404 }
  ]
}`,
    cloudflare: `// Cloudflare Page Rule or Worker
// Block paths containing .env
if (url.pathname.includes('.env')) {
  return new Response('Not found', { status: 404 });
}`,
    nginx: `# nginx.conf
location ~ /\\.env {
    deny all;
    return 404;
}`,
    apache: `# .htaccess
<Files ".env*">
    Order allow,deny
    Deny from all
</Files>`,
    wordpress: `# .htaccess
<Files ".env">
    Order allow,deny
    Deny from all
</Files>`,
    django: `# Ensure .env is in .gitignore and not in static files
# STATICFILES_DIRS should not include project root`,
    rails: `# Ensure .env is in .gitignore
# config/environments/production.rb
config.public_file_server.enabled = false`,
    laravel: `# .htaccess (Laravel includes this by default)
<Files ".env">
    Order allow,deny
    Deny from all
</Files>`,
    react: `// Ensure .env is in .gitignore
// Build process should not include .env in output`,
    vue: `// Ensure .env is in .gitignore
// Vue CLI excludes .env from builds by default`,
    angular: `// Ensure .env is in .gitignore
// Angular CLI excludes .env from builds`,
    generic: `# Block access to .env files at server level
# Add to .gitignore:
.env
.env.local
.env.production`
  },

  "server-disclosure": {
    nextjs: `// Next.js removes x-powered-by by default in production
// Verify with: curl -I https://yoursite.com

// If using custom server:
const nextConfig = {
  poweredByHeader: false
};`,
    express: `// Remove x-powered-by
app.disable('x-powered-by');

// Or use helmet
const helmet = require('helmet');
app.use(helmet.hidePoweredBy());`,
    vercel: `// Vercel automatically handles this
// No action needed`,
    cloudflare: `// Cloudflare Transform Rules
// Remove response header: Server
// Remove response header: X-Powered-By`,
    nginx: `# nginx.conf
server_tokens off;
# Also remove via headers module if needed
more_clear_headers Server;`,
    apache: `# httpd.conf
ServerTokens Prod
ServerSignature Off
Header unset X-Powered-By`,
    wordpress: `// functions.php
function remove_version_headers() {
    header_remove('X-Powered-By');
}
add_action('send_headers', 'remove_version_headers');

// Also remove WordPress version
remove_action('wp_head', 'wp_generator');`,
    django: `# Django doesn't send server headers by default
# If using a reverse proxy, configure there`,
    rails: `# config/application.rb
config.action_dispatch.default_headers.delete('X-Powered-By')`,
    laravel: `// app/Http/Middleware/SecurityHeaders.php
$response->headers->remove('X-Powered-By');`,
    react: `// Configure at hosting/server level`,
    vue: `// Configure at hosting/server level`,
    angular: `// Configure at hosting/server level`,
    generic: `# Remove or obfuscate server version headers
Server: webserver
# Remove X-Powered-By header entirely`
  }
};

/* ════════════════════════════════════════════════════════════
   Base Remediation Data (fallback descriptions/references)
   ════════════════════════════════════════════════════════════ */

const baseRemediations: Record<string, { title: string; description: string; reference: string }> = {
  "missing-csp": {
    title: "Add Content-Security-Policy Header",
    description: "CSP prevents XSS attacks by controlling which resources can be loaded. Without it, attackers can inject malicious scripts.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
  },
  "missing-hsts": {
    title: "Enable HTTP Strict Transport Security",
    description: "HSTS forces browsers to only connect via HTTPS, preventing downgrade attacks and cookie hijacking.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"
  },
  "missing-x-frame-options": {
    title: "Add X-Frame-Options Header",
    description: "Prevents clickjacking attacks by controlling whether the page can be embedded in iframes.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"
  },
  "missing-x-content-type-options": {
    title: "Add X-Content-Type-Options Header",
    description: "Prevents MIME type sniffing attacks that could lead to XSS.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"
  },
  "missing-referrer-policy": {
    title: "Add Referrer-Policy Header",
    description: "Controls how much referrer information is sent with requests, preventing data leakage.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy"
  },
  "missing-permissions-policy": {
    title: "Add Permissions-Policy Header",
    description: "Controls which browser features can be used, reducing attack surface.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"
  },
  "weak-tls": {
    title: "Upgrade to TLS 1.2 or Higher",
    description: "TLS 1.0 and 1.1 have known vulnerabilities. Modern browsers require TLS 1.2+.",
    reference: "https://ssl-config.mozilla.org/"
  },
  "expired-cert": {
    title: "Renew SSL/TLS Certificate",
    description: "Expired certificates cause browser warnings and break HTTPS trust.",
    reference: "https://letsencrypt.org/docs/renewal/"
  },
  "exposed-env": {
    title: "Block Access to .env Files",
    description: "Environment files contain secrets like API keys. They must never be publicly accessible.",
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },
  "exposed-git": {
    title: "Block Access to .git Directory",
    description: "Exposed .git allows attackers to download your entire source code.",
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },
  "cors-wildcard": {
    title: "Restrict CORS to Specific Origins",
    description: "Wildcard CORS allows any website to make authenticated requests to your API.",
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
  },
  "insecure-cookie": {
    title: "Set Secure Cookie Flags",
    description: "Cookies without Secure, HttpOnly, and SameSite flags can be stolen via XSS.",
    reference: "https://owasp.org/www-community/controls/SecureCookieAttribute"
  },
  "server-disclosure": {
    title: "Remove Server Version Headers",
    description: "Server headers reveal technology stack, helping attackers find exploits.",
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  },
  "reentrancy": {
    title: "Implement Checks-Effects-Interactions Pattern",
    description: "Reentrancy allows attackers to drain funds by recursively calling back into the contract.",
    reference: "https://swcregistry.io/docs/SWC-107"
  },
  "tx-origin": {
    title: "Replace tx.origin with msg.sender",
    description: "tx.origin can be spoofed via phishing contracts.",
    reference: "https://swcregistry.io/docs/SWC-115"
  },
  "integer-overflow": {
    title: "Use Solidity 0.8+ or SafeMath",
    description: "Integer overflow can corrupt token balances or bypass checks.",
    reference: "https://swcregistry.io/docs/SWC-101"
  },
  "hardcoded-secret": {
    title: "Move Secrets to Environment Variables",
    description: "Hardcoded secrets in source code can be stolen from version history.",
    reference: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password"
  },
  "outdated-dependency": {
    title: "Update Vulnerable Dependencies",
    description: "Known CVEs in dependencies can be exploited to compromise your application.",
    reference: "https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities"
  },
  "graphql-introspection": {
    title: "Disable GraphQL Introspection in Production",
    description: "Introspection exposes your entire API schema to attackers.",
    reference: "https://www.apollographql.com/blog/graphql/security/why-you-should-disable-graphql-introspection-in-production/"
  },
  "jwt-none": {
    title: "Validate JWT Algorithm",
    description: "alg:none vulnerability allows attackers to forge tokens without a signature.",
    reference: "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/"
  },
  "missing-rate-limit": {
    title: "Implement Rate Limiting",
    description: "Without rate limiting, attackers can brute-force credentials or overwhelm your API.",
    reference: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html"
  },
  "default": {
    title: "Review and Remediate",
    description: "Review the finding details and apply appropriate security controls.",
    reference: "https://owasp.org/www-project-web-security-testing-guide/"
  }
};

/* ════════════════════════════════════════════════════════════
   Main Export Functions
   ════════════════════════════════════════════════════════════ */

/**
 * Get stack-aware remediation with code specific to the detected technology
 */
export function getStackAwareRemediation(findingType: string, stack: DetectedStack | null): RemediationStep {
  const stackType = detectStackType(stack)
  const base = baseRemediations[findingType] || baseRemediations["default"]
  const stackCode = stackSpecificCode[findingType]
  
  let code: string
  if (stackCode && stackCode[stackType]) {
    code = stackCode[stackType]
  } else if (stackCode && stackCode["generic"]) {
    code = stackCode["generic"]
  } else {
    code = `// ${base.title}\n// See reference documentation for implementation details`
  }
  
  return {
    title: base.title,
    description: base.description,
    code,
    reference: base.reference
  }
}

/**
 * Legacy function for backward compatibility
 */
export function getRemediation(findingType: string): RemediationStep {
  return getStackAwareRemediation(findingType, null)
}

/**
 * Get human-readable stack name for display
 */
export function getStackDisplayName(stack: DetectedStack | null): string {
  if (!stack) return "Unknown Stack"
  
  const parts: string[] = []
  if (stack.framework) parts.push(stack.framework)
  if (stack.cms) parts.push(stack.cms)
  if (stack.server) parts.push(stack.server)
  if (stack.cdn) parts.push(`via ${stack.cdn}`)
  
  return parts.length > 0 ? parts.join(" + ") : "Static/Unknown"
}

// Export for backward compatibility
export const remediations = baseRemediations
