import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

function loadRootEnvLocalForDevOnly(): void {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.DATABASE_URL) return;
  const rootEnvLocal = path.resolve(process.cwd(), "..", "..", ".env.local");
  if (!existsSync(rootEnvLocal)) return;
  const content = readFileSync(rootEnvLocal, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    } else {
      const commentIndex = value.search(/(?<!\\)\s+#.*$/);
      if (commentIndex !== -1) value = value.slice(0, commentIndex).trim();
    }
    process.env[key] = value;
  }
}

// Local dev only: repo-root .env.local is two dirs above apps/web.
// Next.js loads only apps/web/.env*, so next dev would miss DATABASE_URL.
// Skipped entirely in production (provider env vars win there).
loadRootEnvLocalForDevOnly();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Postbase-Token, X-Project-ID" },
        ],
      },
    ];
  },
};

export default nextConfig;
