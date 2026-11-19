import { execFileSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const publicDir = path.join(appDir, "public");
const config = JSON.parse(
  await readFile(
    path.join(appDir, "src/lib/seo-data.json"),
    "utf8",
  ),
);

function filenameForRoute(route) {
  if (route === "/") return "home";
  return route
    .replace(/^\/|\/$/g, "")
    .replaceAll("/", "-")
    .replace(/[^a-z0-9-]/gi, "");
}

const entries = [
  ...Object.entries(config.pages).map(([route, entry]) => ({ route, entry })),
  ...Object.entries(config.destinations).map(([slug, entry]) => ({
    route: `/destinations/${slug}`,
    entry,
  })),
  ...Object.entries(config.adventures).map(([slug, entry]) => ({
    route: `/adventures/${slug}`,
    entry,
  })),
];

const outputDir = path.join(publicDir, "og");
await mkdir(outputDir, { recursive: true });

for (const { route, entry } of entries) {
  const sourcePath = path.join(publicDir, entry.imageSource.replace(/^\//, ""));
  const outputPath = path.join(outputDir, `${filenameForRoute(route)}.jpg`);
  const commonArgs = [
    "-auto-orient",
    "-resize",
    "1200x630^",
    "-gravity",
    "center",
    "-extent",
    "1200x630",
    "-strip",
    "-quality",
    "80",
  ];

  if (route === "/") {
    execFileSync("magick", [
      "-size",
      "1200x630",
      "xc:white",
      sourcePath,
      "-resize",
      "460x460",
      "-gravity",
      "center",
      "-composite",
      "-strip",
      "-quality",
      "85",
      outputPath,
    ]);
  } else {
    execFileSync("magick", [sourcePath, ...commonArgs, outputPath]);
  }
  console.log(`Created ${path.relative(appDir, outputPath)}`);
}
