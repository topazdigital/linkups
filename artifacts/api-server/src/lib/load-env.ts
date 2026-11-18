import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const envFilePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.env",
);

if (existsSync(envFilePath)) {
  // Keep DirectAdmin/PM2 environment values authoritative over the local file.
  process.loadEnvFile(envFilePath);
}
