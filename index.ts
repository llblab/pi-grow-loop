import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const STATUS_KEY = "pi-grow-loop";
const DEFAULT_FOLLOW_UP_DELAY_MS = 3000;
const DEFAULT_COUNTDOWN_TICK_MS = 100;

type Timer = ReturnType<typeof setTimeout> & { unref?: () => void };
type PendingIteration = {
  interval: Timer;
  timeout?: Timer;
};

type GrowLoopOptions = {
  followUpDelayMs?: number;
  countdownTickMs?: number;
};

export function buildGrowLoopPrompt(): string {
  return "while true | grow loop";
}

export function getExtensionSkillsDir(extensionUrl: string): string {
  return join(dirname(fileURLToPath(extensionUrl)), "skills");
}

export function getExistingExtensionSkillPaths(extensionUrl: string): string[] {
  const skillsDir = getExtensionSkillsDir(extensionUrl);
  return existsSync(skillsDir) ? [skillsDir] : [];
}

function statusCountdown(ctx: ExtensionContext, seconds: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", "loop") + theme.fg("dim", ` ${seconds.toFixed(1)}s`),
  );
}

function statusRunning(ctx: ExtensionContext, iteration: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", "loop") + theme.fg("dim", ` ∞${iteration}`),
  );
}

function statusDeferred(ctx: ExtensionContext, iteration: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", "loop") + theme.fg("warning", ` ∞${iteration}`),
  );
}

function sendIteration(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  iteration: number,
) {
  statusRunning(ctx, iteration);
  pi.sendUserMessage(buildGrowLoopPrompt());
}

function scheduleIteration(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  iteration: number,
  clearPending: () => void,
  options: Required<GrowLoopOptions>,
): PendingIteration {
  let countdownStartedAt: number | undefined;
  statusDeferred(ctx, iteration);
  const pending = {} as PendingIteration;
  pending.interval = setInterval(() => {
    if (!countdownStartedAt) {
      if (!ctx.isIdle() || ctx.hasPendingMessages()) return;
      countdownStartedAt = Date.now();
      statusCountdown(ctx, options.followUpDelayMs / 1000);
      pending.timeout = setTimeout(() => {
        pending.timeout = undefined;
        if (!ctx.isIdle() || ctx.hasPendingMessages()) {
          countdownStartedAt = undefined;
          statusDeferred(ctx, iteration);
          return;
        }
        clearPending();
        sendIteration(pi, ctx, iteration);
      }, options.followUpDelayMs) as Timer;
      pending.timeout.unref?.();
      return;
    }
    const elapsed = Date.now() - countdownStartedAt;
    const remainingMs = Math.max(options.followUpDelayMs - elapsed, 0);
    if (remainingMs > 0) statusCountdown(ctx, remainingMs / 1000);
  }, options.countdownTickMs) as Timer;
  pending.interval.unref?.();
  return pending;
}

export default function growLoopExtension(
  pi: ExtensionAPI,
  partialOptions: GrowLoopOptions = {},
) {
  const options = {
    followUpDelayMs:
      partialOptions.followUpDelayMs ?? DEFAULT_FOLLOW_UP_DELAY_MS,
    countdownTickMs:
      partialOptions.countdownTickMs ?? DEFAULT_COUNTDOWN_TICK_MS,
  };
  let iteration = 0;
  let lastCtx: ExtensionContext | undefined;
  let pendingIteration: PendingIteration | undefined;
  const clearPending = () => {
    if (!pendingIteration) return;
    if (pendingIteration.timeout) clearTimeout(pendingIteration.timeout);
    clearInterval(pendingIteration.interval);
    pendingIteration = undefined;
  };
  const hideLoopStatus = (ctx: ExtensionContext) => {
    clearPending();
    ctx.ui.setStatus(STATUS_KEY, undefined);
  };
  pi.on("resources_discover", async () => {
    const skillPaths = getExistingExtensionSkillPaths(import.meta.url);
    if (skillPaths.length === 0) return;
    return { skillPaths };
  });
  pi.on("session_shutdown", async () => {
    clearPending();
    lastCtx?.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("agent_end", async (_event, ctx) => {
    lastCtx = ctx;
    if (!pendingIteration) ctx.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("input", async (event, ctx) => {
    lastCtx = ctx;
    if (event.source === "extension") return { action: "continue" };
    hideLoopStatus(ctx);
    return { action: "continue" };
  });
  pi.registerTool({
    name: "grow_loop",
    label: "Grow Loop",
    description:
      "Schedule the next visible Grow Loop iteration after a fixed 3-second operator-interrupt grace countdown. Takes no arguments.",
    promptSnippet:
      "Schedule the next Grow Loop iteration after a fixed interrupt grace countdown.",
    promptGuidelines: [
      "Use grow_loop with no arguments when the Grow Loop skill decides another while-true iteration should run.",
      "Do not pass arguments to grow_loop. To stop, do not call grow_loop; finish with a concise stop proof.",
      "grow_loop waits 3 seconds before scheduling the next iteration so any operator prompt can interrupt the rhythm first.",
    ],
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      lastCtx = ctx;
      clearPending();
      iteration += 1;
      const nextIteration = iteration;
      pendingIteration = scheduleIteration(
        pi,
        ctx,
        nextIteration,
        clearPending,
        options,
      );
      return {
        content: [
          {
            type: "text",
            text: `\nGrow Loop iteration #${nextIteration} deferred until idle, then scheduled after ${options.followUpDelayMs / 1000}s grace delay`,
          },
        ],
        details: { iteration: nextIteration, delayMs: options.followUpDelayMs },
      };
    },
  });
}
