import {
  createPool,
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

export type SqlParameter = string | number | boolean | Date | null;

export interface MysqlConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseUnavailableError extends Error {
  constructor(
    message = "The LinkUps database is not configured or reachable.",
  ) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

let pool: Pool | undefined;

export function hasAnyMysqlConfiguration(): boolean {
  return [
    process.env.MYSQL_HOST,
    process.env.MYSQL_PORT,
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
  ].some((value) => value !== undefined && value.trim() !== "");
}

export function hasMysqlConfiguration(): boolean {
  return Boolean(
    process.env.MYSQL_HOST?.trim() &&
    process.env.MYSQL_DATABASE?.trim() &&
    process.env.MYSQL_USER?.trim() &&
    process.env.MYSQL_PASSWORD,
  );
}

export function getMysqlConnectionConfig(): MysqlConnectionConfig {
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

  return { host, port, database, user, password };
}

export function getMysqlPool(): Pool {
  const config = getMysqlConnectionConfig();

  pool ??= createPool({
    ...config,
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
