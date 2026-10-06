interface ApiErrorLike {
  isAxiosError?: boolean;
  code?: string;
  message?: string;
  config?: {
    method?: string;
    url?: string;
  };
  response?: {
    status?: number;
  };
}

export type ApiFailureKind =
  | 'network'
  | 'timeout'
  | 'authentication'
  | 'permission'
  | 'notFound'
  | 'validation'
  | 'rateLimit'
  | 'server'
  | 'unknown';

export interface ApiFailure {
  kind: ApiFailureKind;
  status?: number;
}

export const classifyApiFailure = (error: unknown): ApiFailure => {
  if (!error || typeof error !== 'object') return { kind: 'unknown' };

  const apiError = error as ApiErrorLike;
  const status = apiError.response?.status;
  const code = apiError.code?.toUpperCase();

  if (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    status === 408 ||
    status === 504
  ) {
    return { kind: 'timeout', status };
  }

  if (typeof status !== 'number') {
    return {
      kind:
        apiError.isAxiosError || code === 'ERR_NETWORK'
          ? 'network'
          : 'unknown',
    };
  }

  if (status === 401) return { kind: 'authentication', status };
  if (status === 403) return { kind: 'permission', status };
  if (status === 404) return { kind: 'notFound', status };
  if (status === 429) return { kind: 'rateLimit', status };
  if (status >= 500) return { kind: 'server', status };
  if (status >= 400) return { kind: 'validation', status };

  return { kind: 'unknown', status };
};

export const isApiConnectionError = (error: unknown): boolean => {
  const kind = classifyApiFailure(error).kind;
  return kind === 'network' || kind === 'timeout';
};

export const describeApiError = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'unknown error';
  }

  const apiError = error as ApiErrorLike;
  const method = apiError.config?.method?.toUpperCase();
  const url = apiError.config?.url;
  const request = [method, url].filter(Boolean).join(' ');
  const status = apiError.response?.status;
  const parts = [
    request || 'unknown request',
    typeof status === 'number' ? `status=${status}` : null,
    apiError.code ? `code=${apiError.code}` : null,
    apiError.message ? `message=${apiError.message}` : null,
  ].filter(Boolean);

  return parts.join(' ');
};
