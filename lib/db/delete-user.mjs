import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnv = path.resolve(__dirname, "..", "..", ".env");
if (typeof process.loadEnvFile === "function" && fs.existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const connectionString =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node delete-user.mjs <email>");
  process.exit(1);
}

const client = new Client({
  connectionString,
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  await client.query("begin");

  const userRes = await client.query(
    "select id, email from users where email = $1",
    [email],
  );

  if (userRes.rowCount === 0) {
    await client.query("rollback");
    console.log(
      JSON.stringify({ email, deleted: false, reason: "User not found" }, null, 2),
    );
    process.exit(0);
  }

  const userId = userRes.rows[0].id;

  const modelsRes = await client.query(
    "delete from models where user_id = $1 returning id",
    [userId],
  );
  const subscriptionsRes = await client.query(
    "delete from subscriptions where user_id = $1 returning id",
    [userId],
  );
  const usersRes = await client.query(
    "delete from users where email = $1 returning id, email",
    [email],
  );

  await client.query("commit");

  console.log(
    JSON.stringify(
      {
        email,
        deleted: true,
        user: usersRes.rows[0],
        deletedModels: modelsRes.rowCount,
        deletedSubscriptions: subscriptionsRes.rowCount,
      },
      null,
      2,
    ),
  );
} catch (error) {
  try {
    await client.query("rollback");
  } catch {}
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
