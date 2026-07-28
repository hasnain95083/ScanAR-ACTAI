import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

function loadEnvFileFallback(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const body = fs.readFileSync(filePath, "utf8");
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const localEnv = path.resolve(process.cwd(), ".env");
const rootEnv = path.resolve(process.cwd(), "../../.env");

if (typeof process.loadEnvFile === "function") {
  if (fs.existsSync(localEnv)) process.loadEnvFile(localEnv);
  if (fs.existsSync(rootEnv)) process.loadEnvFile(rootEnv);
}
loadEnvFileFallback(localEnv);
loadEnvFileFallback(rootEnv);

const connectionString =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_POSTGRES_URL) before running drizzle push.",
  );
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
