export type StorePlatform = 'ios' | 'android';

export interface PlatformPolicy {
  latestVersion?: string;
  minimumVersion?: string;
  minOsVersion?: string;
}

export interface UpdateMessages {
  softTitle?: string;
  softMessage?: string;
  forceTitle?: string;
  forceMessage?: string;
  updateButton?: string;
  laterButton?: string;
}

export interface UpdatePolicy {
  ios?: PlatformPolicy;
  android?: PlatformPolicy;
  messages?: UpdateMessages;
}

export type UpdateDecision =
  | { kind: 'none' }
  | { kind: 'soft' | 'force'; installedVersion: string; latestVersion: string };

const NO_UPDATE: UpdateDecision = { kind: 'none' };

export function normalizeVersion(value: unknown): string | null {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof text !== 'string') return null;
  const match = text.trim().replace(/^v/i, '').match(/^\d+(\.\d+)*/);
  return match ? match[0] : null;
}

export function compareVersions(a: string, b: string): number {
  const left = (normalizeVersion(a) ?? '0').split('.').map(Number);
  const right = (normalizeVersion(b) ?? '0').split('.').map(Number);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

export function parsePolicy(json: unknown): UpdatePolicy | null {
  if (!isRecord(json)) return null;
  return {
    ios: parsePlatformPolicy(json.ios),
    android: parsePlatformPolicy(json.android),
    messages: parseMessages(json.messages),
  };
}

export interface DecideUpdateInput {
  policy: UpdatePolicy;
  platform: StorePlatform;
  installedVersion: string;
  osVersion?: string | number;
}

export function decideUpdate({
  policy,
  platform,
  installedVersion,
  osVersion,
}: DecideUpdateInput): UpdateDecision {
  const rules = policy[platform];
  const installed = normalizeVersion(installedVersion);
  if (!rules || !installed) return NO_UPDATE;

  const latest = rules.latestVersion;
  let minimum = rules.minimumVersion;

  if (minimum && latest && compareVersions(minimum, latest) > 0) {
    minimum = latest;
  }

  const os = normalizeVersion(osVersion);
  if (rules.minOsVersion && os && compareVersions(os, rules.minOsVersion) < 0) {
    return NO_UPDATE;
  }

  if (minimum && compareVersions(installed, minimum) < 0) {
    return { kind: 'force', installedVersion: installed, latestVersion: latest ?? minimum };
  }
  if (latest && compareVersions(installed, latest) < 0) {
    return { kind: 'soft', installedVersion: installed, latestVersion: latest };
  }
  return NO_UPDATE;
}

export async function fetchUpdatePolicy(
  url: string,
  timeoutMs: number,
): Promise<UpdatePolicy | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}t=${Date.now()}`, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return parsePolicy(await response.json());
  } catch (err) {
    if (__DEV__) {
      console.warn('[AppUpdate] ⚠️ Policy fetch error details:', err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const MESSAGE_KEYS = [
  'softTitle',
  'softMessage',
  'forceTitle',
  'forceMessage',
  'updateButton',
  'laterButton',
] as const;

function parsePlatformPolicy(value: unknown): PlatformPolicy | undefined {
  if (!isRecord(value)) return undefined;
  return {
    latestVersion: normalizeVersion(value.latestVersion) ?? undefined,
    minimumVersion: normalizeVersion(value.minimumVersion) ?? undefined,
    minOsVersion: normalizeVersion(value.minOsVersion) ?? undefined,
  };
}

function parseMessages(value: unknown): UpdateMessages | undefined {
  if (!isRecord(value)) return undefined;
  const messages: UpdateMessages = {};
  for (const key of MESSAGE_KEYS) {
    const text = value[key];
    if (typeof text === 'string' && text.trim() !== '') messages[key] = text.trim();
  }
  return messages;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
