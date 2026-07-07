import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import growLoopExtension, { buildGrowLoopPrompt } from "../index.ts";

function createHarness(options: { idle?: boolean; pending?: boolean } = {}) {
  const state = {
    idle: options.idle ?? true,
    pending: options.pending ?? false,
  };
  const handlers = new Map<string, Function>();
  let tool: any;
  const sent: Array<{ content: string; options?: unknown }> = [];
  const statuses: Array<{ key: string; text: string | undefined }> = [];
  const pi = {
    on(event: string, handler: Function) {
      handlers.set(event, handler);
    },
    registerTool(definition: any) {
      tool = definition;
    },
    sendUserMessage(content: string, sendOptions?: unknown) {
      sent.push({ content, options: sendOptions });
    },
  };
  const ctx = {
    ui: {
      theme: {
        fg(_name: string, text: string) {
          return text;
        },
      },
      setStatus(key: string, text: string | undefined) {
        statuses.push({ key, text });
      },
    },
    isIdle() {
      return state.idle;
    },
    hasPendingMessages() {
      return state.pending;
    },
  };
  growLoopExtension(pi as any, { followUpDelayMs: 10, countdownTickMs: 5 });
  const latestStatus = () => statuses.at(-1)?.text;
  const executeTool = (id = "tool") =>
    tool.execute(id, {}, undefined, undefined, ctx);
  const input = (text: string, source = "interactive") =>
    handlers.get("input")?.({ source, text }, ctx);
  const shutdown = () => handlers.get("session_shutdown")?.();
  const assertNoPromptSent = () => assert.equal(sent.length, 0);
  return {
    handlers,
    tool,
    sent,
    statuses,
    ctx,
    state,
    latestStatus,
    executeTool,
    input,
    shutdown,
    assertNoPromptSent,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(assertion: () => void, timeoutMs = 100) {
  const startedAt = Date.now();
  let lastError: unknown;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await wait(5);
    }
  }
  if (lastError) throw lastError;
  assertion();
}

afterEach(() => {
  mock.restoreAll();
});

describe("grow-loop helpers", () => {
  it("builds the compact loop prompt", () => {
    assert.equal(buildGrowLoopPrompt(), "while true | grow loop");
  });
});

describe("grow_loop tool runtime", () => {
  it("sends the compact prompt after the grace delay", async () => {
    const harness = createHarness({ idle: true });
    const result = await harness.executeTool();
    assert.equal(result.details.iteration, 1);
    await waitFor(() =>
      assert.deepEqual(harness.sent, [
        { content: "while true | grow loop", options: undefined },
      ]),
    );
    assert.equal(harness.latestStatus(), "loop ∞1");
  });
  it("round-trips a delivered loop prompt through host hooks before the next schedule", async () => {
    const harness = createHarness({ idle: true });
    const first = await harness.executeTool("first");
    assert.equal(first.details.iteration, 1);
    await wait(25);
    const delivered = harness.sent.at(-1);
    assert.deepEqual(delivered, {
      content: "while true | grow loop",
      options: undefined,
    });
    const inputResult = await harness.handlers.get("input")?.(
      { source: "extension", text: delivered?.content },
      harness.ctx,
    );
    assert.deepEqual(inputResult, { action: "continue" });
    const second = await harness.executeTool("second");
    assert.equal(second.details.iteration, 2);
    await wait(25);
    assert.equal(harness.sent.length, 2);
    assert.equal(harness.latestStatus(), "loop ∞2");
  });
  it("defers the grace countdown while user messages are pending", async () => {
    const harness = createHarness({ pending: true });
    await harness.executeTool();
    await wait(25);
    harness.assertNoPromptSent();
    assert.equal(harness.latestStatus(), "loop ∞1");
    harness.state.pending = false;
    await wait(25);
    assert.deepEqual(harness.sent, [
      { content: "while true | grow loop", options: undefined },
    ]);
  });
  it("waits for the session to become idle before starting the grace countdown", async () => {
    const harness = createHarness({ idle: false });
    await harness.executeTool();
    await wait(25);
    harness.assertNoPromptSent();
    assert.equal(harness.latestStatus(), "loop ∞1");
    harness.state.idle = true;
    await wait(25);
    assert.deepEqual(harness.sent, [
      { content: "while true | grow loop", options: undefined },
    ]);
  });
  it("cancels the previous pending schedule while preserving monotonic numbering", async () => {
    const harness = createHarness({ idle: true });
    await harness.executeTool("first");
    await harness.executeTool("second");
    await wait(25);
    assert.equal(harness.sent.length, 1);
    assert.equal(harness.latestStatus(), "loop ∞2");
  });
  it("user input clears pending work and hides status without blocking the tool", async () => {
    for (const prompt of ["stop", "What changed?", "pause please", "cancel loop"]) {
      const harness = createHarness({ idle: true });
      await harness.executeTool();
      await harness.input(prompt);
      await wait(25);
      harness.assertNoPromptSent();
      assert.equal(harness.latestStatus(), undefined);
      const next = await harness.executeTool();
      assert.equal(next.details.iteration, 2);
    }
  });
  it("returns to deferred waiting if the session becomes busy during the grace countdown", async () => {
    const harness = createHarness({ idle: true });
    await harness.executeTool();
    await wait(8);
    harness.state.idle = false;
    await wait(25);
    harness.assertNoPromptSent();
    assert.equal(harness.latestStatus(), "loop ∞1");
    harness.state.idle = true;
    await waitFor(() =>
      assert.deepEqual(harness.sent, [
        { content: "while true | grow loop", options: undefined },
      ]),
    );
  });
  it("user input cancels an already-created grace timeout and hides status", async () => {
    for (const prompt of ["stop", "pause grow loop", "What changed?"]) {
      const harness = createHarness({ idle: true });
      await harness.executeTool();
      await wait(8);
      await harness.input(prompt);
      await wait(25);
      harness.assertNoPromptSent();
      assert.equal(harness.latestStatus(), undefined);
    }
  });
  it("repeated scheduling cancels an already-created grace timeout", async () => {
    const harness = createHarness({ idle: true });
    await harness.executeTool("first");
    await wait(8);
    await harness.executeTool("second");
    await wait(25);
    assert.deepEqual(harness.sent, [
      { content: "while true | grow loop", options: undefined },
    ]);
    assert.equal(harness.latestStatus(), "loop ∞2");
  });
  it("session shutdown cancels an already-created grace timeout and clears status", async () => {
    const harness = createHarness({ idle: true });
    await harness.executeTool();
    await wait(8);
    await harness.shutdown();
    await wait(25);
    harness.assertNoPromptSent();
    assert.equal(harness.latestStatus(), undefined);
  });
  it("clears pending grace-delay work and visible status on session shutdown", async () => {
    const harness = createHarness({ idle: true });
    await harness.executeTool();
    await harness.shutdown();
    await wait(25);
    harness.assertNoPromptSent();
    assert.equal(harness.latestStatus(), undefined);
  });
});
