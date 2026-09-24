import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  getExtensionSkillsDir,
  getTelegramStatusImportSpecifiers,
  isRawExtensionCheckout,
  registerGrowLoopSkillDiscovery,
} from "../index.ts";
import packageJson from "../package.json" with { type: "json" };

test("package metadata uses only Pi-supported compiled resources", async () => {
  assert.deepEqual(packageJson.pi.extensions, ["./dist/pi-grow-loop/index.js"]);
  assert.deepEqual(packageJson.pi.skills, ["./dist/skills"]);
  assert.equal("sourceExtensions" in packageJson.pi, false);
  assert.equal("sourceSkills" in packageJson.pi, false);
  assert.equal(packageJson.files.includes("dist"), true);
  assert.equal(packageJson.pi.image.endsWith("/banner.jpg"), true);
  assert.equal(packageJson.files.includes("banner.jpg"), true);
  await access(packageJson.pi.extensions[0]);
  await access("banner.jpg");
});

test("Pi resolver distinguishes an auto checkout from a filtered package install", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-grow-loop-resolver-"));
  try {
    const packageManagerModule = await import(
      "../node_modules/@earendil-works/pi-coding-agent/dist/core/package-manager.js"
    );
    const settingsModule = await import(
      "../node_modules/@earendil-works/pi-coding-agent/dist/core/settings-manager.js"
    );
    const cwd = join(root, "cwd");
    const agentDir = join(root, "agent");
    const checkoutRoot = join(agentDir, "extensions", "pi-grow-loop");
    const compiledEntry = join(checkoutRoot, "dist", "pi-grow-loop", "index.js");
    const sourceSkillRoot = join(checkoutRoot, "skills");
    await mkdir(dirname(compiledEntry), { recursive: true });
    await mkdir(join(checkoutRoot, "dist", "skills", "grow-loop"), { recursive: true });
    await mkdir(join(sourceSkillRoot, "grow-loop"), { recursive: true });
    await mkdir(cwd, { recursive: true });
    await writeFile(join(checkoutRoot, "package.json"), JSON.stringify({
      name: "@llblab/pi-grow-loop-fixture",
      pi: {
        extensions: ["./dist/pi-grow-loop/index.js"],
        skills: ["./dist/skills"],
      },
    }));
    await writeFile(compiledEntry, "export default function () {}\n");
    await writeFile(
      join(checkoutRoot, "dist", "skills", "grow-loop", "SKILL.md"),
      "---\nname: grow-loop\ndescription: fixture\n---\n",
    );
    await writeFile(
      join(sourceSkillRoot, "grow-loop", "SKILL.md"),
      "---\nname: grow-loop\ndescription: source fixture\n---\n",
    );

    const autoSettings = settingsModule.SettingsManager.inMemory();
    const autoManager = new packageManagerModule.DefaultPackageManager({
      cwd,
      agentDir,
      settingsManager: autoSettings,
    });
    const autoResolved = await autoManager.resolve();
    assert.equal(autoResolved.extensions.some((entry: { path: string }) => entry.path === compiledEntry), true);
    assert.equal(autoResolved.skills.some((entry: { path: string }) => entry.path.startsWith(checkoutRoot)), false);
    const compiledUrl = pathToFileURL(compiledEntry).href;
    assert.equal(isRawExtensionCheckout(compiledUrl, { agentDir, cwd }), true);
    assert.equal(getExtensionSkillsDir(compiledUrl), sourceSkillRoot);
    let resourceHook: (() => Promise<{ skillPaths: string[] } | undefined>) | undefined;
    assert.equal(registerGrowLoopSkillDiscovery({
      on(name: string, handler: () => Promise<{ skillPaths: string[] } | undefined>) {
        assert.equal(name, "resources_discover");
        resourceHook = handler;
      },
    } as unknown as Parameters<typeof registerGrowLoopSkillDiscovery>[0], compiledUrl, {
      agentDir,
      cwd,
    }), true);
    assert.deepEqual(await resourceHook?.(), { skillPaths: [sourceSkillRoot] });

    const managedRoot = join(root, "managed", "pi-grow-loop");
    await mkdir(dirname(join(managedRoot, "dist", "pi-grow-loop", "index.js")), { recursive: true });
    await mkdir(join(managedRoot, "dist", "skills", "grow-loop"), { recursive: true });
    await writeFile(join(managedRoot, "package.json"), JSON.stringify({
      name: "@llblab/pi-grow-loop-managed-fixture",
      pi: {
        extensions: ["./dist/pi-grow-loop/index.js"],
        skills: ["./dist/skills"],
      },
    }));
    await writeFile(join(managedRoot, "dist", "pi-grow-loop", "index.js"), "export default function () {}\n");
    await writeFile(
      join(managedRoot, "dist", "skills", "grow-loop", "SKILL.md"),
      "---\nname: grow-loop\ndescription: managed fixture\n---\n",
    );
    const managedSettings = settingsModule.SettingsManager.inMemory({
      packages: [{ source: managedRoot, skills: [] }],
    });
    const managedManager = new packageManagerModule.DefaultPackageManager({
      cwd,
      agentDir: join(root, "managed-agent"),
      settingsManager: managedSettings,
    });
    const managedResolved = await managedManager.resolve();
    assert.equal(managedResolved.extensions.some(
      (entry: { path: string; enabled: boolean }) => entry.path.startsWith(managedRoot) && entry.enabled,
    ), true);
    const managedSkill = managedResolved.skills.find(
      (entry: { path: string }) => entry.path.startsWith(managedRoot),
    );
    assert.ok(managedSkill);
    assert.equal(managedSkill.enabled, false);
    assert.equal(managedSkill.metadata.origin, "package");
    assert.equal(isRawExtensionCheckout(
      pathToFileURL(join(managedRoot, "dist", "pi-grow-loop", "index.js")).href,
      { agentDir: join(root, "managed-agent"), cwd },
    ), false);

    const kitRoot = join(root, "pi-kit");
    const nestedGrowRoot = join(kitRoot, "node_modules", "@llblab", "pi-grow-loop");
    const kitEntry = join(nestedGrowRoot, "index.ts");
    const kitSkill = join(nestedGrowRoot, "skills", "grow-loop", "SKILL.md");
    await mkdir(dirname(kitSkill), { recursive: true });
    await writeFile(kitEntry, "export default function () {}\n");
    await writeFile(kitSkill, "---\nname: grow-loop\ndescription: kit fixture\n---\n");
    await writeFile(join(nestedGrowRoot, "package.json"), JSON.stringify({
      name: "@llblab/pi-grow-loop",
    }));
    await writeFile(join(kitRoot, "package.json"), JSON.stringify({
      name: "@llblab/pi-kit-fixture",
      pi: {
        extensions: ["./node_modules/@llblab/pi-grow-loop/index.ts"],
        skills: ["./node_modules/@llblab/pi-grow-loop/skills"],
      },
    }));
    const kitManager = new packageManagerModule.DefaultPackageManager({
      cwd,
      agentDir: join(root, "kit-agent"),
      settingsManager: settingsModule.SettingsManager.inMemory({
        packages: [{ source: kitRoot, skills: [] }],
      }),
    });
    const kitResolved = await kitManager.resolve();
    const kitResolvedSkill = kitResolved.skills.find(
      (entry: { path: string }) => entry.path === kitSkill,
    );
    assert.ok(kitResolvedSkill);
    assert.equal(kitResolvedSkill.enabled, false);
    assert.equal(kitResolvedSkill.metadata.origin, "package");
    assert.equal(isRawExtensionCheckout(pathToFileURL(kitEntry).href, {
      agentDir: join(root, "kit-agent"),
      cwd,
    }), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("package includes package-version-independent bundled skills", async () => {
  const skills = await readdir("skills");
  assert.deepEqual(skills.sort(), ["grow-loop", "while-true"]);
  for (const skill of skills) {
    const source = await readFile(`skills/${skill}/SKILL.md`, "utf8");
    const compiled = await readFile(`dist/skills/${skill}/SKILL.md`, "utf8");
    assert.equal(compiled, source);
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

test("compiled and source runtimes resolve the optional Telegram sibling from their own depth", () => {
  const sourceUrl = new URL("../index.ts", import.meta.url).href;
  const compiledUrl = new URL("../dist/index.js", import.meta.url).href;
  const sourceSpecifiers = getTelegramStatusImportSpecifiers(sourceUrl);
  const compiledSpecifiers = getTelegramStatusImportSpecifiers(compiledUrl);
  assert.equal(sourceSpecifiers[0], "@llblab/pi-telegram/status");
  assert.equal(compiledSpecifiers[0], "@llblab/pi-telegram/status");
  assert.equal(sourceSpecifiers[1], compiledSpecifiers[1]);
  assert.match(sourceSpecifiers[1], /\/pi-telegram\/api\/status\.ts$/);
});
