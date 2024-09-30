import { client, db } from "@/lib/db/drizzle";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";

async function main() {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "/lib/db/migrations"),
  });
  console.log("\x1b[42m\x1b[30m SUCCESS \x1b[0m Migrations complete");
  await client.end();
}

main().catch((error) => {
  console.error(`\x1b[41m\x1b[37m ERROR \x1b[0m Migration failed: ${error}`);
  process.exit(1);
});
