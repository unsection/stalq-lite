import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { configureNeonNetwork } from "../src/lib/neon/configureNetwork";

config({ path: ".env.local" });
config({ path: ".env" });

const run = async () => {
  configureNeonNetwork();

  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL in .env.local");
  }

  const sql = neon(connectionString);
  const drizzleDir = resolve(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(drizzleDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    console.log(`\nApplying ${file}...`);
    const rawSql = readFileSync(resolve(drizzleDir, file), "utf-8");
    const statements = rawSql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      console.log(`Running: ${statement.slice(0, 60)}...`);
      try {
        await sql.query(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("already exists")) {
          console.log("Skipped (already exists)");
          continue;
        }
        throw error;
      }
    }
  }

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log("\nTables in database:", tables.map((row) => row.table_name).join(", "));
  console.log("Migration applied successfully.");
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
