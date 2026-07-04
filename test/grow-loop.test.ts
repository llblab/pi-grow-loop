import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import growLoopExtension, { buildGrowLoopPrompt, isStartInput, isStopInput } from "../index.ts";

function createHarness(options: { idle?: boolean; pending?: boolean } = {}) {
  const state = { idle: options.idle ?? true, pending: options.pending ?? false };
  const handlers = new Map<string, Function>();
  let tool: any;
  const sent: Array<{ content: string; options?: unknown }> = [];
  const statuses: Array<{ key: string; text: string | undefined }> = [];
  const notifications: Array<{ text: string; level: string }> = [];
  const pi = {
    on(event: string, handler: Function) {
      handlers.set(event, handler);
    },
    registerTool(definition: any) {
      tool = definition;
    },
    registerShortcut() {},
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
      notify(text: string, level: string) {
        notifications.push({ text, level });
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
  return { handlers, tool, sent, statuses, notifications, ctx, state };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  mock.restoreAll();
});

describe("grow-loop helpers", () => {
  it("builds the compact loop prompt", () => {
    assert.equal(buildGrowLoopPrompt(), "while true | grow loop");
  });
  it("matches explicit stop prompts", () => {
    assert.equal(isStopInput("stop"), true);
    assert.equal(isStopInput("stop loop!"), true);
    assert.equal(isStopInput("stop grow loop"), true);
    assert.equal(isStopInput("stop while true"), true);
    assert.equal(isStopInput("please stop"), false);
    assert.equal(isStopInput("go"), false);
  });
  it("matches explicit restart prompts", () => {
    assert.equal(isStartInput("grow loop"), true);
    assert.equal(isStartInput("while true"), true);
    assert.equal(isStartInput("do it"), true);
    assert.equal(isStartInput("continue"), true);
    assert.equal(isStartInput("stop"), false);
  });
});

describe("grow_loop tool runtime", () => {
  it("sends the compact prompt after the grace delay", async () => {
    const harness = createHarness({ idle: true });
    const result = await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    assert.equal(result.details.iteration, 1);
    await wait(25);
    assert.deepEqual(harness.sent, [{ content: "while true | grow loop", options: undefined }]);
    assert.equal(harness.statuses.at(-1)?.text, "loop ∞1");
  });
  it("round-trips a delivered loop prompt through host hooks before the next schedule", async () => {
    const harness = createHarness({ idle: true });
    const first = await harness.tool.execute("first", {}, undefined, undefined, harness.ctx);
    assert.equal(first.details.iteration, 1);
    await wait(25);
    const delivered = harness.sent.at(-1);
    assert.deepEqual(delivered, { content: "while true | grow loop", options: undefined });
    const inputResult = await harness.handlers.get("input")?.({ source: "extension", text: delivered?.content }, harness.ctx);
    assert.deepEqual(inputResult, { action: "continue" });
    const beforeResult = await harness.handlers.get("before_agent_start")?.({ prompt: delivered?.content, systemPrompt: "base" }, harness.ctx);
    assert.equal(beforeResult, undefined);
    const second = await harness.tool.execute("second", {}, undefined, undefined, harness.ctx);
    assert.equal(second.details.iteration, 2);
    await wait(25);
    assert.equal(harness.sent.length, 2);
    assert.equal(harness.statuses.at(-1)?.text, "loop ∞2");
  });
  it("defers the grace countdown while user messages are pending", async () => {
    const harness = createHarness({ pending: true });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, "loop ∞1");
    assert.equal(harness.notifications.length, 0);
    harness.state.pending = false;
    await wait(25);
    assert.deepEqual(harness.sent, [{ content: "while true | grow loop", options: undefined }]);
  });
  it("waits for the session to become idle before starting the grace countdown", async () => {
    const harness = createHarness({ idle: false });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, "loop ∞1");
    harness.state.idle = true;
    await wait(25);
    assert.deepEqual(harness.sent, [{ content: "while true | grow loop", options: undefined }]);
  });
  it("cancels the previous pending schedule while preserving monotonic numbering", async () => {
    const harness = createHarness({ idle: true });
    await harness.tool.execute("first", {}, undefined, undefined, harness.ctx);
    await harness.tool.execute("second", {}, undefined, undefined, harness.ctx);
    await wait(25);
    assert.equal(harness.sent.length, 1);
    assert.equal(harness.statuses.at(-1)?.text, "loop ∞2");
  });
  it("stop input clears pending work, blocks scheduling, and explicit restart re-enables it without resetting numbering", async () => {
    const harness = createHarness({ idle: true });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await harness.handlers.get("input")?.({ source: "interactive", text: "stop" }, harness.ctx);
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, "loop stopped");
    const blocked = await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    assert.equal(blocked.details.stopped, true);
    await harness.handlers.get("input")?.({ source: "interactive", text: "grow loop" }, harness.ctx);
    const second = await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    assert.equal(second.details.iteration, 2);
  });
  it("ordinary user input hides loop status and cancels pending scheduling without stopping the loop", async () => {
    const harness = createHarness({ idle: true });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await harness.handlers.get("input")?.({ source: "interactive", text: "What changed?" }, harness.ctx);
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, undefined);
    const next = await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    assert.equal(next.details.iteration, 2);
  });
  it("uses followUp delivery if the session becomes busy during the grace countdown", async () => {
    const harness = createHarness({ idle: true });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await wait(8);
    harness.state.idle = false;
    await wait(25);
    assert.deepEqual(harness.sent, [{ content: "while true | grow loop", options: { deliverAs: "followUp" } }]);
  });
  it("aborts pending grace-delay work when the tool signal is aborted", async () => {
    const harness = createHarness({ idle: true });
    const controller = new AbortController();
    await harness.tool.execute("tool", {}, controller.signal, undefined, harness.ctx);
    controller.abort();
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, undefined);
  });
  it("clears pending grace-delay work and visible status on session shutdown", async () => {
    const harness = createHarness({ idle: true });
    await harness.tool.execute("tool", {}, undefined, undefined, harness.ctx);
    await harness.handlers.get("session_shutdown")?.();
    await wait(25);
    assert.equal(harness.sent.length, 0);
    assert.equal(harness.statuses.at(-1)?.text, undefined);
  });
  it("injects a no-op instruction for queued loop prompts after stop", async () => {
    const harness = createHarness({ idle: true });
    await harness.handlers.get("input")?.({ source: "interactive", text: "stop" }, harness.ctx);
    const result = await harness.handlers.get("before_agent_start")?.({ prompt: "while true | grow loop", systemPrompt: "base" }, harness.ctx);
    assert.match(result.systemPrompt, /must not perform work/);
  });
});
