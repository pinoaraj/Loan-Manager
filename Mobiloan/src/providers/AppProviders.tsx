import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { localDb } from '../data/database';
import { sessionStore } from '../lib/secureSession';
import { isAuthApiError } from '../services/api';
import { syncService } from '../services/sync';
import type { SessionRecord } from '../types/sync';

const queryClient = new QueryClient();

const invalidateOfflineQueries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sync-snapshot'] }),
    queryClient.invalidateQueries({ queryKey: ['clients'] }),
    queryClient.invalidateQueries({ queryKey: ['client-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['loan-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['collection-queue'] }),
    queryClient.invalidateQueries({ queryKey: ['pending-outbox'] }),
    queryClient.invalidateQueries({ queryKey: ['rejected-outbox'] }),
  ]);
};

interface SessionContextValue {
  isReady: boolean;
  isOnline: boolean | null;
  hasOfflineData: boolean;
  lastSyncAt: string | null;
  needsReauth: boolean;
  authMessage: string | null;
  session: SessionRecord | null;
  setSession: (session: SessionRecord | null) => Promise<void>;
  refreshAppState: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [session, setSessionState] = useState<SessionRecord | null>(null);

  const refreshAppState = async () => {
    const [online, snapshot] = await Promise.all([
      syncService.isOnline().catch(() => null),
      localDb.getSnapshot(),
    ]);

    setIsOnline(online);
    setHasOfflineData(
      snapshot.totalClients > 0 ||
        snapshot.totalLoans > 0 ||
        snapshot.totalPayments > 0 ||
        snapshot.totalTransactions > 0,
    );
    setLastSyncAt(snapshot.lastSyncAt);
  };

  useEffect(() => {
    const bootstrap = async () => {
      await syncService.initialize();
      const savedSession = await sessionStore.load();
      setSessionState(savedSession);
      await refreshAppState();
      setIsReady(true);
    };

    bootstrap().catch((error) => {
      console.error('Mobile bootstrap failed', error);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady || !session || session.mode === 'local') {
      return;
    }

    let cancelled = false;

    const runAutoSync = async () => {
      try {
        await syncService.syncAll(session);
        if (!cancelled) {
          setNeedsReauth(false);
          setAuthMessage(null);
          await invalidateOfflineQueries();
          await refreshAppState();
        }
      } catch (error) {
        if (!cancelled) {
          if (isAuthApiError(error)) {
            setNeedsReauth(true);
            setAuthMessage(error.message);
          }
          console.warn('Mobile auto sync skipped', error);
          await refreshAppState();
        }
      }
    };

    runAutoSync();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshAppState().catch((error) => console.warn('Mobile state refresh skipped', error));
        runAutoSync();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [isReady, session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      isReady,
      isOnline,
      hasOfflineData,
      lastSyncAt,
      needsReauth,
      authMessage,
      session,
      async setSession(nextSession) {
        if (nextSession) {
          await sessionStore.save(nextSession);
        } else {
          await sessionStore.clear();
        }

        setSessionState(nextSession);
        setNeedsReauth(false);
        setAuthMessage(null);
        queryClient.clear();
        await refreshAppState();
      },
      refreshAppState,
    }),
    [authMessage, hasOfflineData, isOnline, isReady, lastSyncAt, needsReauth, session],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </QueryClientProvider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside AppProviders');
  }

  return context;
}
