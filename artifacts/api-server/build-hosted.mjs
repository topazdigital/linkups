import { spawnSync } from "node:child_process";
import {
  cp,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(apiDir, "../..");
const webDir = path.join(workspaceRoot, "artifacts/linkups-adventures");
const releaseDir = path.join(apiDir, "hosted-release");

function runPnpm(args, env = {}) {
  const result = spawnSync("pnpm", args, {
    cwd: workspaceRoot,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `pnpm ${args.join(" ")} failed with status ${result.status}`,
    );
  }
}

runPnpm(["--filter", "@workspace/linkups-adventures", "run", "build"], {
  BASE_PATH: "/",
  PORT: "3000",
  NODE_ENV: "production",
});
runPnpm(["--filter", "@workspace/api-server", "run", "build"], {
  NODE_ENV: "production",
});

const webOutput = path.join(webDir, "dist/public");
const apiOutput = path.join(apiDir, "dist");
await rm(releaseDir, { recursive: true, force: true });
await mkdir(path.join(releaseDir, "dist"), { recursive: true });
for (const entry of await readdir(apiOutput, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".mjs")) {
    await copyFile(
      path.join(apiOutput, entry.name),
      path.join(releaseDir, "dist", entry.name),
    );
  }
}
await cp(webOutput, path.join(releaseDir, "public"), { recursive: true });
await cp(path.join(apiDir, "database"), path.join(releaseDir, "database"), {
  recursive: true,
});
await cp(
  path.join(apiDir, ".env.example"),
  path.join(releaseDir, ".env.example"),
);

await writeFile(
  path.join(releaseDir, "package.json"),
  `${JSON.stringify(
    {
      name: "linkups-adventures-hosted",
      private: true,
      type: "module",
      engines: { node: ">=20" },
      scripts: { start: "node dist/index.mjs" },
      dependencies: { mysql2: "^3.24.5" },
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  path.join(releaseDir, "README.md"),
  [
    "# LinkUps Adventures hosting bundle",
    "",
    "This bundle runs the React website and its API in one Node.js process. It is built to use the `PORT` assigned by the hosting control panel; do not choose or reuse a port manually.",
    "",
    "## Before starting",
    "",
    "- Use this bundle only for the LinkUps domain.",
    "- Configure the Node app's private root and its public web root according to DirectAdmin's Node.js application settings. Do not expose `dist/`, `database/`, `node_modules/`, `package.json`, or environment files to direct file download.",
    "- Set `STATIC_DIR=public`. For database and admin settings, use the DirectAdmin app's private environment or copy `.env.example` to `.env` in the private app root and replace every placeholder.",
    "- The app loads its private-root `.env` at startup, without overriding values already supplied by DirectAdmin or PM2. Never commit `.env` or place it under `public/`.",
    "- Create a MySQL database/user in DirectAdmin and set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`; verify `MYSQL_DATABASE` is the intended database.",
    "- On server startup, the app initializes the baseline schema when needed, seeds an empty adventure catalogue once, and applies pending numbered migrations from `database/migrations/`.",
    "- The migration runner records completed versions in `linkups_schema_migrations`; never edit an applied migration or rerun the seed to publish content changes.",
    "- Install production dependencies with `npm install --omit=dev`, then use the control panel's assigned app port and its start command `npm start`.",
    "",
    "The app continues to serve the website when MySQL settings are absent, but database-backed features remain unavailable. When settings are present, a failed database connection or migration stops startup and is reported in the server log.",
    "",
  ].join("\n"),
);

const packageText = await readFile(
  path.join(releaseDir, "package.json"),
  "utf8",
);
console.log(`Hosted bundle created at ${releaseDir}`);
console.log(`Runtime package manifest: ${packageText.trim()}`);
