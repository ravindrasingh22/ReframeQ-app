const DEFAULT_API_BASE_URL = 'http://192.168.1.6:8001';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function readEnv(name: string): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  const value = env[name]?.trim();
  return value ? value : undefined;
}


const apiBaseUrl = normalizeBaseUrl(
  readEnv('EXPO_PUBLIC_API_BASE_URL') ?? DEFAULT_API_BASE_URL,
);

export const appConfig = {
  apiBaseUrl,
  apiTimeoutMs: Number(readEnv('EXPO_PUBLIC_API_TIMEOUT_MS') ?? '15000'),
  appEnv: readEnv('EXPO_PUBLIC_APP_ENV') ?? 'development',
} as const;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${normalizedPath}`;
}
