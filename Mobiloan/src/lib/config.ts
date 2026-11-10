import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '3011';
const API_PATH = '/api';
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const LOOPBACK_HOST = '127.0.0.1';
const LOCALHOST_HOSTS = new Set(['127.0.0.1', '0.0.0.0', 'localhost']);

const normalizeApiUrl = (value: string) => value.trim().replace(/\/+$/, '');

const resolveExpoHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  try {
    return new URL(`http://${hostUri}`).hostname;
  } catch {
    return hostUri.split(':')[0] ?? null;
  }
};

const buildApiUrl = (host: string) => `http://${host}:${API_PORT}${API_PATH}`;

const resolveHostCandidates = () => {
  const hosts: string[] = [];
  const expoHost = resolveExpoHost();

  if (expoHost) {
    hosts.push(expoHost);
    if (Platform.OS === 'android' && LOCALHOST_HOSTS.has(expoHost)) {
      hosts.push(ANDROID_EMULATOR_HOST);
    }
  }

  if (Platform.OS === 'android') {
    hosts.push(ANDROID_EMULATOR_HOST);
  }

  hosts.push(LOOPBACK_HOST, 'localhost');

  return [...new Set(hosts)];
};

const resolveDefaultApiUrl = () => {
  const [firstCandidate] = resolveHostCandidates();
  return buildApiUrl(firstCandidate || LOOPBACK_HOST);
};

export const getApiCandidates = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const urls = new Set<string>();

  if (configured) {
    urls.add(normalizeApiUrl(configured));
  }

  for (const host of resolveHostCandidates()) {
    urls.add(normalizeApiUrl(buildApiUrl(host)));
  }

  if (urls.size === 0) {
    urls.add(normalizeApiUrl(resolveDefaultApiUrl()));
  }

  return [...urls];
};

export const API_URL = getApiCandidates()[0] || normalizeApiUrl(resolveDefaultApiUrl());

export const APP_THEME = {
  ink: '#102A43',
  slate: '#486581',
  mist: '#F0F4F8',
  card: '#FFFFFF',
  accent: '#0E7490',
  accentSoft: '#CFFAFE',
  success: '#0F766E',
  warning: '#B45309',
  danger: '#B91C1C',
};
