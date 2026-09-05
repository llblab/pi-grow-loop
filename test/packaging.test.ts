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
  assert.equal(packageJson.pi.image.endsWith("/banner.jpg"), true);
  assert.equal(packageJson.files.includes("banner.jpg"), true);
  await access(packageJson.pi.extensions[0]);
  await access("banner.jpg");
});

test("package includes package-version-independent bundled skills", async () => {
  const skills = await readdir("skills");
  assert.deepEqual(skills.sort(), ["grow-loop", "while-true"]);
  for (const skill of skills) {
    const source = await readFile(`skills/${skill}/SKILL.md`, "utf8");
    assert.match(source, new RegExp(`^name: ${skill}$`, "m"));
    assert.doesNotMatch(source, /^metadata:\s*\n\s+version:/m);
  }
});

test("CI validates the declared minimum and latest Node.js versions", async () => {
  const workflow = await readFile(".github/workflows/validate.yml", "utf8");
  assert.match(workflow, /node-version:\s*\n\s*- "22\.19\.0"\s*\n\s*- latest/);
  assert.match(workflow, /node-version: \$\{\{ matrix\.node-version \}\}/);
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
    assert.match(worker, new RegExp(`\\*\\*${resolutionCase}\\*\\*:`));
  }
  assert.match(worker, /preserve the same declared surface across bounded invocations/);
  assert.match(worker, /Relevance alone never makes it an open-work surface/);
  assert.match(worker, /Never infer tasks from procedural prose, examples, insights, historical delivery sections/);
  assert.match(worker, /same knowledge skill later declares a new truthful surface/);
  assert.match(worker, /worker alone interprets and validates work-surface declarations/);
});

test("while-true batches independent tasks into one attributable validation cohort", async () => {
  const worker = await readFile("skills/while-true/SKILL.md", "utf8");
  assert.match(worker, /batch them into the same validation cohort/);
  assert.match(worker, /cheap focused check that can falsify its own change/);
  assert.match(worker, /Prefer batching as the default/);
  assert.match(worker, /Use a single-task cohort when the task is large/);
  assert.match(worker, /Per-task falsification/);
  assert.match(worker, /Shared cohort validation/);
  assert.match(worker, /Do not batch unrelated scope merely to amortize validation/);
});

test("grow-loop consumes the worker cohort handoff without reinterpreting batching", async () => {
  const meta = await readFile("skills/grow-loop/SKILL.md", "utf8");
  assert.match(meta, /while-true.*alone resolves and validates the canonical open-work surface/);
  assert.match(meta, /\[Handoff\]\(\.\.\/while-true\/SKILL\.md#handoff\)/);
  assert.match(meta, /without redoing worker implementation analysis/);
  assert.match(meta, /evaluates the cohort handoff as one checkpoint/);
  assert.match(meta, /does not reinterpret its batching/);
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
