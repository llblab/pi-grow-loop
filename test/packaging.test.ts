import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  getExistingExtensionSkillPaths,
  getExtensionSkillsDir,
} from "../index.ts";
import packageJson from "../package.json" with { type: "json" };

test("package metadata exposes source TypeScript extension and bundled skills", async () => {
  assert.deepEqual(packageJson.pi.extensions, ["./index.ts"]);
  assert.deepEqual(packageJson.pi.skills, ["./skills"]);
  assert.equal("sourceExtensions" in packageJson.pi, false);
  assert.deepEqual(packageJson.pi.sourceSkills, ["./skills"]);
  await access(packageJson.pi.extensions[0]);
});

test("package includes version-synchronized bundled skills", async () => {
  const skills = await readdir("skills");
  assert.deepEqual(skills.sort(), ["grow-loop", "while-true"]);
  for (const skill of skills) {
    const source = await readFile(`skills/${skill}/SKILL.md`, "utf8");
    assert.match(source, new RegExp(`^  version: ${packageJson.version}$`, "m"));
  }
});

test("auto-discovered source checkout contributes co-located skills", async () => {
  const indexSource = await readFile("index.ts", "utf8");
  assert.match(indexSource, /resources_discover/);
  assert.match(indexSource, /getExistingExtensionSkillPaths/);
  assert.equal(
    getExtensionSkillsDir(import.meta.url).endsWith("/test/skills"),
    true,
  );
  assert.deepEqual(
    getExistingExtensionSkillPaths(
      new URL("../index.ts", import.meta.url).href,
    ),
    [new URL("../skills", import.meta.url).pathname],
  );
  assert.deepEqual(getExistingExtensionSkillPaths(import.meta.url), []);
});
