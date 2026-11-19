import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ignoredDirectories = new Set([".git", "dist", "node_modules"]);

export async function getSourceFingerprint(sourceRoot) {
  const root = path.resolve(sourceRoot);
  const files = [];

  async function collect(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await collect(filePath);
      } else if (entry.isFile()) {
        files.push(filePath);
      }
    }
  }

  await collect(root);

  const fingerprint = createHash("sha256");
  for (const filePath of files) {
    const relativePath = path.relative(root, filePath).split(path.sep).join("/");
    const fileHash = createHash("sha256")
      .update(await readFile(filePath))
      .digest("hex");
    fingerprint.update(relativePath).update("\0").update(fileHash).update("\n");
  }

  return fingerprint.digest("hex");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sourceRoot = process.argv[2];
  if (!sourceRoot) {
    throw new Error("Usage: node source-fingerprint.mjs <source-directory>");
  }
  console.log(await getSourceFingerprint(sourceRoot));
}
