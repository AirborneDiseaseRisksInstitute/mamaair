interface ApiErrorLike {
  isAxiosError?: boolean;
  code?: string;
  response?: {
    status?: number;
  };
}

export const isApiConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const apiError = error as ApiErrorLike;
  const status = apiError.response?.status;

  if (typeof status === 'number') return status >= 500;

  return Boolean(
    apiError.isAxiosError ||
      apiError.code === 'ERR_NETWORK' ||
      apiError.code === 'ECONNABORTED' ||
      apiError.code === 'ETIMEDOUT',
  );
};
