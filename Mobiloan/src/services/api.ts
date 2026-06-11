import { API_URL } from '../lib/config';
import type {
  SessionRecord,
  SyncBootstrapResponse,
  SyncChangesResponse,
  SyncMutation,
  SyncPushResponse,
} from '../types/sync';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export class MobileApiError extends Error {
  code: string | null;
  status: number;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.code = code;
  }
}

export const isAuthApiError = (error: unknown): error is MobileApiError =>
  error instanceof MobileApiError && (error.status === 401 || error.status === 403);

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = body?.error || body?.message || 'Request failed';
    throw new MobileApiError(message, response.status, body?.code ?? null);
  }

  return body as T;
}

export const mobileApi = {
  async login(username: string, password: string): Promise<SessionRecord> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ username, password }),
    });

    const data = await parseResponse<{ token: string; user: { username?: string } }>(response);

    return {
      token: data.token,
      username: data.user?.username || username,
    };
  },

  async fetchBootstrap(token: string): Promise<SyncBootstrapResponse> {
    const response = await fetch(`${API_URL}/sync/bootstrap`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse<SyncBootstrapResponse>(response);
  },

  async fetchChanges(token: string, cursor: string): Promise<SyncChangesResponse> {
    const response = await fetch(`${API_URL}/sync/changes?cursor=${encodeURIComponent(cursor)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse<SyncChangesResponse>(response);
  },

  async pushMutations(token: string, mutations: SyncMutation[]): Promise<SyncPushResponse> {
    const response = await fetch(`${API_URL}/sync/push`, {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mutations }),
    });

    return parseResponse<SyncPushResponse>(response);
  },
};
