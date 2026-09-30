import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_UPDATE_CONFIG } from './config';

const SNOOZE_KEY_PREFIX = '@salesdash_update_snooze_';

export async function isSnoozed(version: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`${SNOOZE_KEY_PREFIX}${version}`);
    if (!raw) return false;

    if (APP_UPDATE_CONFIG.snoozeDurationMs <= 0) return true;

    const snoozedAt = parseInt(raw, 10);
    if (Number.isNaN(snoozedAt)) return false;

    const elapsed = Date.now() - snoozedAt;
    return elapsed < APP_UPDATE_CONFIG.snoozeDurationMs;
  } catch {
    return false;
  }
}

export async function setSnoozed(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SNOOZE_KEY_PREFIX}${version}`, Date.now().toString());
  } catch {
    // Ignore write failures
  }
}

export async function clearSnooze(version: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SNOOZE_KEY_PREFIX}${version}`);
  } catch {
    // Ignore
  }
}
