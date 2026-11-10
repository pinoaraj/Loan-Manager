import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { SessionRecord } from '../types/sync';

const SESSION_KEY = 'loan-manager-mobile-session';

const getWebStorage = () => {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
};

const loadFromWeb = (): SessionRecord | null => {
  const storage = getWebStorage();
  const raw = storage?.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionRecord;
  } catch {
    return null;
  }
};

const canUseNativeSecureStore = () =>
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function' &&
  typeof SecureStore.deleteItemAsync === 'function';

export const sessionStore = {
  async load(): Promise<SessionRecord | null> {
    if (Platform.OS === 'web') {
      return loadFromWeb();
    }

    if (!canUseNativeSecureStore()) {
      return null;
    }

    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      return null;
    }
  },

  async save(session: SessionRecord): Promise<void> {
    const serialized = JSON.stringify(session);

    if (Platform.OS === 'web') {
      getWebStorage()?.setItem(SESSION_KEY, serialized);
      return;
    }

    if (!canUseNativeSecureStore()) {
      return;
    }

    await SecureStore.setItemAsync(SESSION_KEY, serialized);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      getWebStorage()?.removeItem(SESSION_KEY);
      return;
    }

    if (!canUseNativeSecureStore()) {
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
