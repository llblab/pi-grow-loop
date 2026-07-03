import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const STATUS_KEY = "pi-grow-loop";
const DEFAULT_FOLLOW_UP_DELAY_MS = 3000;
const DEFAULT_COUNTDOWN_TICK_MS = 100;

const STOP_INPUT_RE =
  /^(stop)(\s+(grow\s*loop|while\s*true|loop))?[.!?\s]*$/iu;
const START_INPUT_RE =
  /^(go|continue|do it|grow\s*loop|while\s*true)(\s+(grow\s*loop|while\s*true|loop))?[.!?\s]*$/iu;

type Timer = ReturnType<typeof setTimeout> & { unref?: () => void };
type PendingIteration = {
  timeout: Timer;
  interval: Timer;
  cleanup?: () => void;
};

type GrowLoopOptions = {
  followUpDelayMs?: number;
  countdownTickMs?: number;
};

export function buildGrowLoopPrompt(): string {
  return "while true | grow loop";
}

export function isStopInput(text: string): boolean {
  return STOP_INPUT_RE.test(text.trim());
}

export function isStartInput(text: string): boolean {
  return START_INPUT_RE.test(text.trim());
}

export function isGrowLoopPrompt(text: string): boolean {
  return text.trim() === buildGrowLoopPrompt();
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

function statusText(ctx: ExtensionContext, text: string) {
  ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("dim", text));
}

function sendIteration(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  iteration: number,
) {
  const prompt = buildGrowLoopPrompt();
  statusRunning(ctx, iteration);
  if (ctx.isIdle()) {
    pi.sendUserMessage(prompt);
    return;
  }
  pi.sendUserMessage(prompt, { deliverAs: "followUp" });
}

function scheduleIteration(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  iteration: number,
  clearPending: () => void,
  markStarted: () => void,
  options: Required<GrowLoopOptions>,
  cleanup?: () => void,
): PendingIteration {
  const startedAt = Date.now();
  statusCountdown(ctx, options.followUpDelayMs / 1000);
  const interval = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(options.followUpDelayMs - elapsed, 0);
    if (remainingMs > 0) statusCountdown(ctx, remainingMs / 1000);
  }, options.countdownTickMs) as Timer;
  const timeout = setTimeout(() => {
    clearPending();
    if (ctx.hasPendingMessages()) {
      statusText(ctx, "loop paused");
      ctx.ui.notify(
        "Grow Loop paused because a user message is pending",
        "info",
      );
      return;
    }
    markStarted();
    sendIteration(pi, ctx, iteration);
  }, options.followUpDelayMs) as Timer;
  interval.unref?.();
  timeout.unref?.();
  return { timeout, interval, cleanup };
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
  let stopRequested = false;
  let lastCtx: ExtensionContext | undefined;
  let pendingIteration: PendingIteration | undefined;
  const clearPending = () => {
    if (!pendingIteration) return;
    clearTimeout(pendingIteration.timeout);
    clearInterval(pendingIteration.interval);
    pendingIteration.cleanup?.();
    pendingIteration = undefined;
  };
  const hideLoopStatus = (ctx: ExtensionContext) => {
    clearPending();
    ctx.ui.setStatus(STATUS_KEY, undefined);
  };
  const stopLoopStatus = (ctx: ExtensionContext) => {
    clearPending();
    stopRequested = true;
    statusText(ctx, "loop stopped");
  };
  const resumeLoopStatus = () => {
    stopRequested = false;
  };
  pi.on("session_shutdown", async () => {
    clearPending();
    lastCtx?.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("input", async (event, ctx) => {
    lastCtx = ctx;
    if (event.source === "extension") return { action: "continue" };
    if (isStopInput(event.text)) {
      stopLoopStatus(ctx);
      return { action: "continue" };
    }
    hideLoopStatus(ctx);
    if (isStartInput(event.text)) resumeLoopStatus();
    return { action: "continue" };
  });
  pi.on("before_agent_start", async (event) => {
    if (!stopRequested || !isGrowLoopPrompt(event.prompt)) return;
    return {
      systemPrompt:
        event.systemPrompt +
        "\n\nGrow Loop stop is active. This queued grow-loop prompt must not perform work and must not call grow_loop again. Reply with a concise stop acknowledgement/proof only, until the operator explicitly restarts Grow Loop.",
    };
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
      "grow_loop waits 3 seconds before scheduling the next iteration so operator stop prompts can arrive first.",
    ],
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, signal, _onUpdate, ctx) {
      lastCtx = ctx;
      if (stopRequested) {
        return {
          content: [
            {
              type: "text",
              text: "Grow Loop is stopped; ask explicitly to restart before scheduling another iteration",
            },
          ],
          details: { stopped: true },
        };
      }
      clearPending();
      iteration += 1;
      const nextIteration = iteration;
      const abortPending = () => stopLoopStatus(ctx);
      signal?.addEventListener("abort", abortPending, { once: true });
      pendingIteration = scheduleIteration(
        pi,
        ctx,
        nextIteration,
        clearPending,
        () => {},
        options,
        () => signal?.removeEventListener("abort", abortPending),
      );
      return {
        content: [
          {
            type: "text",
            text: `\nGrow Loop iteration #${nextIteration} scheduled after ${options.followUpDelayMs / 1000}s grace delay`,
          },
        ],
        details: { iteration: nextIteration, delayMs: options.followUpDelayMs },
      };
    },
  });
}
