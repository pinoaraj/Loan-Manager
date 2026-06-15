import { API_URL, getApiCandidates } from '../lib/config';
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
const REQUEST_TIMEOUT_MS = 4000;

let lastWorkingApiUrl = API_URL;

export class MobileApiError extends Error {
  code: string | null;
  status: number;
  attemptedUrls?: string[];

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    attemptedUrls?: string[],
  ) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.code = code;
    this.attemptedUrls = attemptedUrls;
  }
}

export const isAuthApiError = (error: unknown): error is MobileApiError =>
  error instanceof MobileApiError && (error.status === 401 || error.status === 403);

const isNetworkError = (error: unknown) =>
  (error instanceof Error && error.name === 'AbortError') ||
  error instanceof TypeError ||
  (error instanceof Error &&
    /network request failed|fetch failed|load failed|failed to fetch/i.test(error.message));

const describeAttemptedUrls = (urls: string[]) =>
  urls.length > 0 ? ` Endpoints probados: ${urls.join(', ')}` : '';

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = body?.error || body?.message || 'Request failed';
    throw new MobileApiError(message, response.status, body?.code ?? null);
  }

  return body as T;
}

async function requestWithFallback<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const attemptedUrls: string[] = [];
  const candidates = [lastWorkingApiUrl, ...getApiCandidates()].filter(
    (url, index, array) => Boolean(url) && array.indexOf(url) === index,
  );

  let lastError: unknown;

  for (const baseUrl of candidates) {
    const requestUrl = `${baseUrl}${path}`;
    attemptedUrls.push(requestUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(requestUrl, {
        ...init,
        signal: controller.signal,
      });
      const data = await parseResponse<T>(response);
      lastWorkingApiUrl = baseUrl;
      return data;
    } catch (error) {
      lastError = error;

      if (error instanceof MobileApiError && error.status < 500) {
        throw error;
      }

      if (!isNetworkError(error) && !(error instanceof MobileApiError)) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof MobileApiError) {
    throw new MobileApiError(
      `${lastError.message}.${describeAttemptedUrls(attemptedUrls)}`,
      lastError.status,
      lastError.code,
      attemptedUrls,
    );
  }

  throw new MobileApiError(
    `No se pudo conectar con el backend.${describeAttemptedUrls(attemptedUrls)}`,
    503,
    'BACKEND_UNREACHABLE',
    attemptedUrls,
  );
}

export const mobileApi = {
  async login(username: string, password: string): Promise<SessionRecord> {
    const data = await requestWithFallback<{ token: string; username?: string; user?: { username?: string } }>(
      '/auth/login',
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ username, password }),
      },
    );

    return {
      token: data.token,
      username: data.user?.username || data.username || username,
    };
  },

  async fetchBootstrap(token: string): Promise<SyncBootstrapResponse> {
    return requestWithFallback<SyncBootstrapResponse>('/sync/bootstrap', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async fetchChanges(token: string, cursor: string): Promise<SyncChangesResponse> {
    return requestWithFallback<SyncChangesResponse>(
      `/sync/changes?cursor=${encodeURIComponent(cursor)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  },

  async pushMutations(token: string, mutations: SyncMutation[]): Promise<SyncPushResponse> {
    return requestWithFallback<SyncPushResponse>('/sync/push', {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mutations }),
    });
  },
};
