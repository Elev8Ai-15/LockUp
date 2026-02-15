import "@testing-library/jest-dom/vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock motion/react to avoid animation issues in tests
vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        // Return a forwardRef component for any HTML element (div, span, circle, line, etc.)
        const { forwardRef } = require("react")
        return forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
          const {
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            whileHover: _whileHover,
            whileTap: _whileTap,
            variants: _variants,
            strokeDasharray: _sda,
            strokeDashoffset: _sdo,
            pathLength: _pl,
            ...rest
          } = props
          const Component = prop as string
          return <Component ref={ref} {...rest} />
        })
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
}))

// Suppress ResizeObserver errors
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
