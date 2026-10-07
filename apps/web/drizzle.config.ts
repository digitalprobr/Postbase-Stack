import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "drizzle-kit";

function resolveConfigDir(): string {
  // @ts-ignore - __dirname exists when drizzle-kit loads this as CJS
  if (typeof __dirname !== "undefined") return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}

function loadDotEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
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
        value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    } else {
      const commentIndex = value.search(/(?<!\\)\s+#.*$/);
      if (commentIndex !== -1) value = value.slice(0, commentIndex).trim();
    }
    process.env[key] = value;
  }
}

// pnpm db:push runs from apps/web, but DATABASE_URL lives in repo-root .env.local
// (two dirs above web). Next.js env loading doesn't apply to the drizzle-kit CLI,
// so load it explicitly before reading process.env.
loadDotEnvFile(path.resolve(resolveConfigDir(), "../../.env.local"));

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["_postbase", "public"],
} satisfies Config;
