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
const MIN_AFTER_SECONDS = 3;
const MAX_AFTER_SECONDS = 3600;

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
  expectOwnPrompt: () => void,
) {
  statusRunning(ctx, iteration);
  expectOwnPrompt();
  pi.sendUserMessage(buildGrowLoopPrompt());
}

function scheduleIteration(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  iteration: number,
  clearPending: () => void,
  expectOwnPrompt: () => void,
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
        sendIteration(pi, ctx, iteration, expectOwnPrompt);
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
  let ownPromptPending = false;
  const clearPending = () => {
    if (!pendingIteration) return;
    if (pendingIteration.timeout) clearTimeout(pendingIteration.timeout);
    clearInterval(pendingIteration.interval);
    pendingIteration = undefined;
  };
  const hideLoopStatus = (ctx: ExtensionContext) => {
    ownPromptPending = false;
    clearPending();
    ctx.ui.setStatus(STATUS_KEY, undefined);
  };
  pi.on("resources_discover", async () => {
    const skillPaths = getExistingExtensionSkillPaths(import.meta.url);
    if (skillPaths.length === 0) return;
    return { skillPaths };
  });
  pi.on("session_shutdown", async () => {
    ownPromptPending = false;
    clearPending();
    lastCtx?.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("agent_settled", async (_event, ctx) => {
    lastCtx = ctx;
    if (!pendingIteration) ctx.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("input", async (event, ctx) => {
    lastCtx = ctx;
    const isOwnPrompt =
      event.source === "extension" &&
      ownPromptPending &&
      event.text === buildGrowLoopPrompt();
    if (isOwnPrompt) {
      ownPromptPending = false;
      return { action: "continue" };
    }
    hideLoopStatus(ctx);
    return { action: "continue" };
  });
  pi.registerTool({
    name: "grow_loop",
    label: "Grow Loop",
    description:
      "Schedule the next visible Grow Loop iteration after an optional delay in seconds (default: 3).",
    promptSnippet:
      "Schedule the next Grow Loop iteration after an optional delay.",
    promptGuidelines: [
      "Use grow_loop when the Grow Loop skill decides another while-true iteration should run; omit after_seconds for the default 3-second delay.",
      "Increase grow_loop after_seconds from 3 up to 3600 when continuation should wait for asynchronous work; never shorten the 3-second operator-interrupt window.",
      "Choose grow_loop after_seconds from evidence about the expected remaining wait, then reassess after each wake instead of repeating the previous delay mechanically.",
      "To stop, do not call grow_loop; finish with a concise stop proof.",
    ],
    parameters: Type.Object({
      after_seconds: Type.Optional(
        Type.Number({
          minimum: MIN_AFTER_SECONDS,
          maximum: MAX_AFTER_SECONDS,
          default: 3,
          description: "Seconds to wait after Pi becomes idle before starting the next iteration (maximum: 3600)",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      lastCtx = ctx;
      ownPromptPending = false;
      clearPending();
      iteration += 1;
      const nextIteration = iteration;
      const delayMs =
        params.after_seconds === undefined
          ? options.followUpDelayMs
          : params.after_seconds * 1000;
      pendingIteration = scheduleIteration(
        pi,
        ctx,
        nextIteration,
        clearPending,
        () => {
          ownPromptPending = true;
        },
        { ...options, followUpDelayMs: delayMs },
      );
      return {
        content: [
          {
            type: "text",
            text: `\nGrow Loop iteration #${nextIteration} deferred until idle, then scheduled after ${delayMs / 1000}s delay`,
          },
        ],
        details: { iteration: nextIteration, delayMs },
      };
    },
  });
}
