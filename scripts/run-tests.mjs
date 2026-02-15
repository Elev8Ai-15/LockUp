import { execSync } from "child_process"

try {
  const result = execSync("npx vitest run --reporter=verbose", {
    cwd: "/vercel/share/v0-project",
    encoding: "utf-8",
    timeout: 60000,
    env: { ...process.env, NODE_ENV: "test" },
  })
  console.log(result)
} catch (error) {
  console.log(error.stdout || "")
  console.log(error.stderr || "")
  console.log("Exit code:", error.status)
}
