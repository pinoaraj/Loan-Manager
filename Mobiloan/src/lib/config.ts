import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '3011';
const API_PATH = '/api';
const ANDROID_EMULATOR_HOST = '10.0.2.2';
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

const resolveDefaultApiUrl = () => {
  const expoHost = resolveExpoHost();
  if (expoHost) {
    const apiHost =
      Platform.OS === 'android' && LOCALHOST_HOSTS.has(expoHost)
        ? ANDROID_EMULATOR_HOST
        : expoHost;
    return `http://${apiHost}:${API_PORT}${API_PATH}`;
  }

  const loopbackHost = Platform.OS === 'android' ? ANDROID_EMULATOR_HOST : '127.0.0.1';
  return `http://${loopbackHost}:${API_PORT}${API_PATH}`;
};

export const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL || resolveDefaultApiUrl(),
);

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
