import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import test from "node:test";

import packageJson from "../package.json" with { type: "json" };

test("package metadata exposes source TypeScript extension and bundled skills", async () => {
  assert.deepEqual(packageJson.pi.extensions, ["./index.ts"]);
  assert.deepEqual(packageJson.pi.skills, ["./skills"]);
  assert.equal("sourceExtensions" in packageJson.pi, false);
  assert.equal("sourceSkills" in packageJson.pi, false);
  await access(packageJson.pi.extensions[0]);
});

test("package includes the bundled skill directories directly", async () => {
  const skills = await readdir("skills");
  assert.deepEqual(skills.sort(), ["grow-loop", "while-true"]);
  await access("skills/grow-loop/SKILL.md");
  await access("skills/while-true/SKILL.md");
});
