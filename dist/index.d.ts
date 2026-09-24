import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
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
export type GrowLoopTelegramStatusRegistrar = (provider: GrowLoopTelegramStatusProvider) => (() => void) | undefined;
type GrowLoopOptions = {
    followUpDelayMs?: number;
    countdownTickMs?: number;
    /** Injection seam for the optional pi-telegram status line; defaults to the public pi-telegram membrane. */
    registerTelegramStatusLine?: GrowLoopTelegramStatusRegistrar;
};
export declare function buildGrowLoopPrompt(): string;
export declare function getAgentDir(env?: Record<string, string | undefined>): string;
export declare function getExtensionPackageRoot(extensionUrl: string): string;
export interface RawExtensionCheckoutOptions {
    agentDir?: string;
    cwd?: string;
}
export declare function isRawExtensionCheckout(extensionUrl: string, options?: RawExtensionCheckoutOptions): boolean;
export declare function getExtensionSkillsDir(extensionUrl: string): string;
export declare function getExistingExtensionSkillPaths(extensionUrl: string): string[];
export declare function getTelegramStatusImportSpecifiers(extensionUrl: string): string[];
export declare function registerGrowLoopSkillDiscovery(pi: Pick<ExtensionAPI, "on">, extensionUrl?: string, options?: RawExtensionCheckoutOptions): boolean;
export declare function formatGrowLoopTelegramValue(progress: GrowLoopTelegramProgress): string;
export default function growLoopExtension(pi: ExtensionAPI, partialOptions?: GrowLoopOptions): void;
export {};
