#!/usr/bin/env node

/**
 * Builds or verifies the distributive JavaScript, declarations, Pi entrypoint,
 * and Skills without exposing a partial tree.
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const DIST_DIR = "dist";
const checkOnly = process.argv.includes("--check");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? "unknown"}.`);
  }
}

function listFiles(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    return entry.isDirectory() ? listFiles(root, path) : [relative(root, path)];
  }).sort();
}

function assertTreesEqual(expectedRoot, actualRoot) {
  if (!existsSync(expectedRoot)) {
    throw new Error(`${expectedRoot} is missing; run npm run build.`);
  }
  const expectedFiles = listFiles(expectedRoot);
  const actualFiles = listFiles(actualRoot);
  if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) {
    throw new Error("dist file inventory is stale; run npm run build.");
  }
  for (const path of expectedFiles) {
    if (!readFileSync(join(expectedRoot, path)).equals(readFileSync(join(actualRoot, path)))) {
      throw new Error(`dist/${path} is stale; run npm run build.`);
    }
  }
}

function replaceDist(candidate) {
  const backup = `.dist-backup-${process.pid}-${Date.now()}`;
  const hadDist = existsSync(DIST_DIR);
  if (hadDist) renameSync(DIST_DIR, backup);
  try {
    renameSync(candidate, DIST_DIR);
    if (hadDist) rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    if (hadDist && existsSync(backup) && !existsSync(DIST_DIR)) {
      renameSync(backup, DIST_DIR);
    }
    throw error;
  }
}

const candidate = mkdtempSync(join(process.cwd(), ".dist-build-"));
try {
  run(process.execPath, [
    join("node_modules", "typescript", "bin", "tsc"),
    "-p",
    "tsconfig.build.json",
    "--outDir",
    candidate,
  ]);

  mkdirSync(join(candidate, "pi-grow-loop"), { recursive: true });
  const entrypoint = 'export { default } from "../index.js";\n';
  writeFileSync(join(candidate, "pi-grow-loop", "index.js"), entrypoint, "utf8");
  writeFileSync(join(candidate, "pi-grow-loop", "index.d.ts"), entrypoint, "utf8");
  cpSync("skills", join(candidate, "skills"), { recursive: true });
  run(process.execPath, ["--check", join(candidate, "pi-grow-loop", "index.js")]);

  if (checkOnly) {
    assertTreesEqual(DIST_DIR, candidate);
    console.log("pi-grow-loop: dist is current");
  } else {
    replaceDist(candidate);
  }
} finally {
  rmSync(candidate, { recursive: true, force: true });
}
