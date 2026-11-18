import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import { logger } from "./logger";
import { getMysqlConnectionConfig } from "./mysql";

const migrationTable = "linkups_schema_migrations";
const initialSchemaVersion = "000_initial_schema";
const initialSeedVersion = "000_initial_catalog_seed";

interface RecordedMigration extends RowDataPacket {
  checksum: string;
  outcome: string;
}

function digest(contents: string): string {
  return createHash("sha256").update(contents).digest("hex");
}

function isDuplicateColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_FIELDNAME"
  );
}

export function splitSqlStatements(contents: string): string[] {
  const statements: string[] = [];
  let statement = "";
  let quote: "'" | '"' | "`" | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < contents.length; index += 1) {
    const char = contents[index];
    const next = contents[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        statement += "\n";
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        statement += " ";
        index += 1;
      }
      continue;
    }

    if (quote) {
      statement += char;
      if (char === "\\" && quote !== "`" && next !== undefined) {
        statement += next;
        index += 1;
      } else if (char === quote) {
        if (next === quote) {
          statement += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (
      char === "-" &&
      next === "-" &&
      (contents[index + 2] === undefined || /\s/.test(contents[index + 2]))
    ) {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "#") {
      inLineComment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      statement += char;
      continue;
    }

    if (char === ";") {
      const trimmed = statement.trim();
      if (trimmed) statements.push(trimmed);
      statement = "";
      continue;
    }

    statement += char;
  }

  if (quote) {
    throw new Error("A MySQL script contains an unterminated quoted value.");
  }
  if (inBlockComment) {
    throw new Error("A MySQL script contains an unterminated block comment.");
  }

  const finalStatement = statement.trim();
  if (finalStatement) statements.push(finalStatement);
  return statements;
}

async function readMigrationRecord(
  connection: Connection,
  version: string,
): Promise<RecordedMigration | undefined> {
  const [rows] = await connection.execute<RecordedMigration[]>(
    `SELECT checksum, outcome FROM ${migrationTable} WHERE version = ? LIMIT 1`,
    [version],
  );
  return rows[0];
}

async function recordMigration(
  connection: Connection,
  version: string,
  checksum: string,
  outcome = "applied",
): Promise<void> {
  await connection.execute(
    `INSERT INTO ${migrationTable} (version, checksum, outcome) VALUES (?, ?, ?)`,
    [version, checksum, outcome],
  );
}

async function runSqlFile(
  connection: Connection,
  filePath: string,
  options: { ignoreExistingColumns?: boolean } = {},
): Promise<string> {
  const contents = await readFile(filePath, "utf8");
  const statements = splitSqlStatements(contents);

  for (const [index, statement] of statements.entries()) {
    try {
      await connection.query(statement);
    } catch (error) {
      if (options.ignoreExistingColumns && isDuplicateColumnError(error)) {
        logger.info(
          { file: path.basename(filePath), statement: index + 1 },
          "Migration column already exists; continuing safely",
        );
        continue;
      }

      throw new Error(
        `Database script ${path.basename(filePath)} failed at statement ${index + 1}.`,
        { cause: error },
      );
    }
  }

  return contents;
}

async function applyMigrationFile(
  connection: Connection,
  filePath: string,
): Promise<void> {
  const version = path.basename(filePath);
  const contents = await readFile(filePath, "utf8");
  const checksum = digest(contents);
  const previous = await readMigrationRecord(connection, version);

  if (previous) {
    if (previous.checksum !== checksum) {
      throw new Error(
        `Applied migration ${version} was edited. Add a new migration instead of changing an applied file.`,
      );
    }
    return;
  }

  await runSqlFile(connection, filePath, { ignoreExistingColumns: true });
  await recordMigration(connection, version, checksum);
  logger.info({ migration: version }, "MySQL migration applied");
}

async function tableHasRows(
  connection: Connection,
  tableName: "adventures" | "destinations",
): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT 1 AS has_rows FROM \`${tableName}\` LIMIT 1`,
  );
  return rows.length > 0;
}

async function applyInitialSeed(connection: Connection, databaseDir: string) {
  const seedFile = path.join(databaseDir, "seed.mysql");
  const seedContents = await readFile(seedFile, "utf8");
  const previous = await readMigrationRecord(connection, initialSeedVersion);
  if (previous) return;

  const hasAdventureRows = await tableHasRows(connection, "adventures");
  const hasDestinationRows = await tableHasRows(connection, "destinations");
  if (hasAdventureRows || hasDestinationRows) {
    await recordMigration(
      connection,
      initialSeedVersion,
      digest(seedContents),
      "skipped_existing_catalog",
    );
    logger.info(
      "Initial catalogue seed skipped because adventures or destinations already contain data",
    );
    return;
  }

  await runSqlFile(connection, seedFile);
  await recordMigration(connection, initialSeedVersion, digest(seedContents));
  logger.info("Initial MySQL catalogue seed applied");
}

export async function runMysqlMigrations(): Promise<void> {
  const config = getMysqlConnectionConfig();
  const connection = await createConnection({
    ...config,
    charset: "utf8mb4",
    connectTimeout: 8000,
    multipleStatements: false,
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${migrationTable} (
        version VARCHAR(191) NOT NULL PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        outcome VARCHAR(40) NOT NULL DEFAULT 'applied',
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const databaseDir = path.resolve(process.cwd(), "database");
    const schemaFile = path.join(databaseDir, "schema.mysql");
    const schemaContents = await readFile(schemaFile, "utf8");
    const previousSchema = await readMigrationRecord(
      connection,
      initialSchemaVersion,
    );

    if (!previousSchema) {
      await runSqlFile(connection, schemaFile);
      await recordMigration(
        connection,
        initialSchemaVersion,
        digest(schemaContents),
      );
      logger.info("Initial MySQL schema applied");
    }

    await applyInitialSeed(connection, databaseDir);

    const migrationsDir = path.join(databaseDir, "migrations");
    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".mysql"))
      .sort();

    for (const file of migrationFiles) {
      await applyMigrationFile(connection, path.join(migrationsDir, file));
    }
  } finally {
    await connection.end();
  }
}
