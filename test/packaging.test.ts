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

test("while-true discovers declared work surfaces without naming producers", async () => {
  const worker = await readFile("skills/while-true/SKILL.md", "utf8");
  assert.match(worker, /Canonical open work: <path or external reference>/);
  assert.match(worker, /Do not scan unrelated skills/);
  assert.doesNotMatch(worker, /GCFMOS|FMOS/);
  for (const resolutionCase of [
    "Relative path",
    "External reference",
    "Scope mismatch",
    "Portfolio pointer",
    "Stale or missing surface",
    "Competing declarations",
  ]) {
    assert.match(worker, new RegExp(`\\*\\*${resolutionCase}:\\*\\*`));
  }
  assert.match(worker, /preserve the same declared surface across bounded invocations/);
  assert.match(worker, /Relevance alone never makes it an open-work surface/);
  assert.match(worker, /Never infer tasks from procedural prose, examples, insights, historical delivery sections/);
  assert.match(worker, /same knowledge skill later declares a new truthful surface/);
  assert.match(worker, /worker alone interprets and validates work-surface declarations/);
});

test("grow-loop consumes the worker handoff without producer-specific interpretation", async () => {
  const meta = await readFile("skills/grow-loop/SKILL.md", "utf8");
  assert.match(meta, /consume its handoff without redoing worker implementation analysis/);
  assert.doesNotMatch(meta, /GCFMOS|FMOS/);
  assert.doesNotMatch(meta, /Relative path:|External reference:|Portfolio pointer:/);
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
