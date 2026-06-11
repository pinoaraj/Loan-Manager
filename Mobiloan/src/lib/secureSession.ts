import * as SecureStore from 'expo-secure-store';

import type { SessionRecord } from '../types/sync';

const SESSION_KEY = 'loan-manager-mobile-session';

export const sessionStore = {
  async load(): Promise<SessionRecord | null> {
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
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
