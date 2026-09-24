import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const STATUS_KEY = "pi-grow-loop";
const STATUS_LABEL = "grow-loop";
const DEFAULT_FOLLOW_UP_DELAY_MS = 3000;
const DEFAULT_COUNTDOWN_TICK_MS = 100;
const MIN_AFTER_SECONDS = 3;
const MAX_AFTER_SECONDS = 3600;
const TELEGRAM_STATUS_IMPORT_SPECIFIERS = getTelegramStatusImportSpecifiers(import.meta.url);

type Timer = ReturnType<typeof setTimeout> & { unref?: () => void };
type PendingIteration = {
  interval: Timer;
  timeout?: Timer;
  countdownStartedAt?: number;
  countdownDelayMs?: number;
};

export interface GrowLoopTelegramProgress {
  iteration: number;
  state: "waiting" | "countdown" | "running";
  remainingSeconds?: number;
}

export interface GrowLoopTelegramStatusLine {
  label: string;
  value: string;
}

export type GrowLoopTelegramStatusProvider = () => GrowLoopTelegramStatusLine | undefined;
export type GrowLoopTelegramStatusRegistrar = (
  provider: GrowLoopTelegramStatusProvider,
) => (() => void) | undefined;

interface TelegramStatusLineModule {
  registerTelegramStatusLineProvider?: (
    provider: GrowLoopTelegramStatusProvider,
    options: { id: string },
  ) => () => void;
}

type GrowLoopOptions = {
  followUpDelayMs?: number;
  countdownTickMs?: number;
  /** Injection seam for the optional pi-telegram status line; defaults to the public pi-telegram membrane. */
  registerTelegramStatusLine?: GrowLoopTelegramStatusRegistrar;
};

export function buildGrowLoopPrompt(): string {
  return "while true | grow loop";
}

export function getAgentDir(
  env: Record<string, string | undefined> = process.env,
): string {
  return env.PI_CODING_AGENT_DIR
    ? resolve(env.PI_CODING_AGENT_DIR)
    : join(homedir(), ".pi", "agent");
}

export function getExtensionPackageRoot(extensionUrl: string): string {
  let current = dirname(fileURLToPath(extensionUrl));
  while (true) {
    if (existsSync(join(current, "package.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return dirname(fileURLToPath(extensionUrl));
    current = parent;
  }
}

export interface RawExtensionCheckoutOptions {
  agentDir?: string;
  cwd?: string;
}

export function isRawExtensionCheckout(
  extensionUrl: string,
  options: RawExtensionCheckoutOptions = {},
): boolean {
  const packageRoot = resolve(getExtensionPackageRoot(extensionUrl));
  const agentDir = resolve(options.agentDir ?? getAgentDir());
  const cwd = resolve(options.cwd ?? process.cwd());
  return dirname(packageRoot) === join(agentDir, "extensions") ||
    dirname(packageRoot) === join(cwd, ".pi", "extensions");
}

export function getExtensionSkillsDir(extensionUrl: string): string {
  return join(getExtensionPackageRoot(extensionUrl), "skills");
}

export function getExistingExtensionSkillPaths(extensionUrl: string): string[] {
  const skillsDir = getExtensionSkillsDir(extensionUrl);
  return existsSync(skillsDir) ? [skillsDir] : [];
}

export function getTelegramStatusImportSpecifiers(extensionUrl: string): string[] {
  const siblingPath = join(
    dirname(getExtensionPackageRoot(extensionUrl)),
    "pi-telegram",
    "api",
    "status.ts",
  );
  return [
    "@llblab/pi-telegram/status",
    pathToFileURL(siblingPath).href,
  ];
}

export function registerGrowLoopSkillDiscovery(
  pi: Pick<ExtensionAPI, "on">,
  extensionUrl = import.meta.url,
  options: RawExtensionCheckoutOptions = {},
): boolean {
  if (!isRawExtensionCheckout(extensionUrl, options)) return false;
  pi.on("resources_discover", async () => {
    const skillPaths = getExistingExtensionSkillPaths(extensionUrl);
    if (skillPaths.length === 0) return;
    return { skillPaths };
  });
  return true;
}

export function formatGrowLoopTelegramValue(progress: GrowLoopTelegramProgress): string {
  return `∞${progress.iteration}`;
}

async function registerGrowLoopTelegramStatus(
  provider: GrowLoopTelegramStatusProvider,
): Promise<(() => void) | undefined> {
  for (const specifier of TELEGRAM_STATUS_IMPORT_SPECIFIERS) {
    try {
      const imported = (await import(specifier)) as TelegramStatusLineModule;
      if (typeof imported.registerTelegramStatusLineProvider === "function") {
        return imported.registerTelegramStatusLineProvider(provider, { id: "@llblab/pi-grow-loop" });
      }
    } catch {
      // pi-telegram is optional; its absence only disables the Telegram status line.
    }
  }
  return undefined;
}

function statusCountdown(ctx: ExtensionContext, seconds: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", STATUS_LABEL) +
      theme.fg("dim", ` ${seconds.toFixed(1)}s`),
  );
}

function statusRunning(ctx: ExtensionContext, iteration: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", STATUS_LABEL) + theme.fg("dim", ` ∞${iteration}`),
  );
}

function statusDeferred(ctx: ExtensionContext, iteration: number) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus(
    STATUS_KEY,
    theme.fg("accent", STATUS_LABEL) +
      theme.fg("warning", ` ∞${iteration}`),
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
  options: Required<Pick<GrowLoopOptions, "followUpDelayMs" | "countdownTickMs">>,
): PendingIteration {
  statusDeferred(ctx, iteration);
  const pending = {} as PendingIteration;
  pending.interval = setInterval(() => {
    if (pending.countdownStartedAt === undefined) {
      if (!ctx.isIdle() || ctx.hasPendingMessages()) return;
      pending.countdownStartedAt = Date.now();
      pending.countdownDelayMs = options.followUpDelayMs;
      statusCountdown(ctx, options.followUpDelayMs / 1000);
      pending.timeout = setTimeout(() => {
        pending.timeout = undefined;
        if (!ctx.isIdle() || ctx.hasPendingMessages()) {
          pending.countdownStartedAt = undefined;
          pending.countdownDelayMs = undefined;
          statusDeferred(ctx, iteration);
          return;
        }
        clearPending();
        sendIteration(pi, ctx, iteration, expectOwnPrompt);
      }, options.followUpDelayMs) as Timer;
      pending.timeout.unref?.();
      return;
    }
    const elapsed = Date.now() - pending.countdownStartedAt;
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
    registerTelegramStatusLine: partialOptions.registerTelegramStatusLine,
  };
  let iteration = 0;
  let lastCtx: ExtensionContext | undefined;
  let pendingIteration: PendingIteration | undefined;
  let ownPromptPending = false;
  let scheduledThisTurn = false;
  let runningIteration: number | undefined;
  let unregisterTelegramStatus: (() => void) | undefined;
  let telegramRegistration: Promise<void> | undefined;
  let telegramGeneration = 0;
  const clearPending = () => {
    if (!pendingIteration) return;
    if (pendingIteration.timeout) clearTimeout(pendingIteration.timeout);
    clearInterval(pendingIteration.interval);
    pendingIteration = undefined;
  };
  const telegramStatusProvider = (): GrowLoopTelegramStatusLine | undefined => {
    if (pendingIteration) {
      const state = pendingIteration.countdownStartedAt === undefined ? "waiting" : "countdown";
      return { label: "Grow Loop", value: formatGrowLoopTelegramValue({ iteration, state }) };
    }
    if (runningIteration !== undefined) {
      return { label: "Grow Loop", value: formatGrowLoopTelegramValue({ iteration: runningIteration, state: "running" }) };
    }
    return undefined;
  };
  const ensureTelegramStatusRegistered = () => {
    if (unregisterTelegramStatus || telegramRegistration) return;
    if (options.registerTelegramStatusLine) {
      unregisterTelegramStatus = options.registerTelegramStatusLine(telegramStatusProvider) ?? undefined;
      return;
    }
    const generation = telegramGeneration;
    telegramRegistration = registerGrowLoopTelegramStatus(telegramStatusProvider)
      .then((unregister) => {
        if (generation !== telegramGeneration) {
          unregister?.();
          return;
        }
        unregisterTelegramStatus = unregister;
      })
      .finally(() => {
        if (generation === telegramGeneration) telegramRegistration = undefined;
      });
  };
  const hideLoopStatus = (ctx: ExtensionContext) => {
    ownPromptPending = false;
    runningIteration = undefined;
    clearPending();
    ctx.ui.setStatus(STATUS_KEY, undefined);
  };
  ensureTelegramStatusRegistered();
  registerGrowLoopSkillDiscovery(pi);
  pi.on("session_shutdown", async () => {
    ownPromptPending = false;
    scheduledThisTurn = false;
    runningIteration = undefined;
    clearPending();
    telegramGeneration += 1;
    unregisterTelegramStatus?.();
    unregisterTelegramStatus = undefined;
    telegramRegistration = undefined;
    lastCtx?.ui.setStatus(STATUS_KEY, undefined);
  });
  pi.on("session_start", async () => {
    ensureTelegramStatusRegistered();
  });
  pi.on("agent_settled", async (_event, ctx) => {
    lastCtx = ctx;
    if (!pendingIteration) {
      runningIteration = undefined;
      ctx.ui.setStatus(STATUS_KEY, undefined);
    }
  });
  pi.on("input", async (event, ctx) => {
    lastCtx = ctx;
    scheduledThisTurn = false;
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
      runningIteration = undefined;
      clearPending();
      const isReschedule = scheduledThisTurn;
      if (!isReschedule) {
        iteration += 1;
        scheduledThisTurn = true;
      }
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
          runningIteration = nextIteration;
        },
        { followUpDelayMs: delayMs, countdownTickMs: options.countdownTickMs },
      );
      return {
        content: [
          {
            type: "text",
            text: isReschedule
              ? `\nTool grow_loop was already called this turn. Iteration #${nextIteration} remains scheduled; delay updated to ${delayMs / 1000}s`
              : `\nGrow Loop iteration #${nextIteration} deferred until idle, then scheduled after ${delayMs / 1000}s delay`,
          },
        ],
        details: { iteration: nextIteration, delayMs },
      };
    },
  });
}
