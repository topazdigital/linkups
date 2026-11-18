import app from "./app";
import { logger } from "./lib/logger";
import { runMysqlMigrations } from "./lib/migrations";
import { hasAnyMysqlConfiguration, hasMysqlConfiguration } from "./lib/mysql";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  if (hasMysqlConfiguration()) {
    await runMysqlMigrations();
  } else if (hasAnyMysqlConfiguration()) {
    throw new Error(
      "Some MYSQL_* settings are present, but the database configuration is incomplete.",
    );
  } else {
    logger.warn(
      "MySQL migrations skipped because MYSQL_* settings are not configured; database-backed features will remain unavailable",
    );
  }

  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

startServer().catch((err: unknown) => {
  logger.error({ err }, "Server startup failed");
  process.exit(1);
});
