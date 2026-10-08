import {
  createPool,
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

export type SqlParameter = string | number | boolean | Date | null;

export class DatabaseUnavailableError extends Error {
  constructor(message = "The LinkUps database is not configured or reachable.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

let pool: Pool | undefined;

export function getMysqlPool(): Pool {
  const host = process.env.MYSQL_HOST?.trim();
  const database = process.env.MYSQL_DATABASE?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const password = process.env.MYSQL_PASSWORD;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !database || !user || !password) {
    throw new DatabaseUnavailableError(
      "The database connection has not been configured.",
    );
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new DatabaseUnavailableError(
      "The database connection configuration is invalid.",
    );
  }

  pool ??= createPool({
    host,
    port,
    database,
    user,
    password,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 30,
    connectTimeout: 8000,
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  return pool;
}

export async function selectRows<T extends RowDataPacket>(
  sql: string,
  values: SqlParameter[] = [],
): Promise<T[]> {
  const [rows] = await getMysqlPool().execute<T[]>(sql, values);
  return rows;
}

export async function executeSql(
  sql: string,
  values: SqlParameter[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, values);
  return result;
}

export async function closeMysqlPool(): Promise<void> {
  const activePool = pool;
  pool = undefined;
  await activePool?.end();
}
