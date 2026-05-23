/**
 * Typed errors for the Holded client.
 * Allows callers to distinguish auth failures, rate limits and general HTTP errors
 * without parsing raw error messages.
 */

export class HoldedApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'HoldedApiError';
  }
}

export class HoldedAuthError extends HoldedApiError {
  constructor(path: string, body: string) {
    super(`Holded authentication failed for ${path} — check the API key and permissions.`, 401, path, body);
    this.name = 'HoldedAuthError';
  }
}

export class HoldedPermissionError extends HoldedApiError {
  constructor(path: string, body: string) {
    super(`Holded permission denied for ${path} — the API key may lack the required scope.`, 403, path, body);
    this.name = 'HoldedPermissionError';
  }
}

export class HoldedRateLimitError extends HoldedApiError {
  constructor(path: string) {
    super(`Holded rate limit reached for ${path}. Retry after a short delay.`, 429, path, '');
    this.name = 'HoldedRateLimitError';
  }
}

export class HoldedIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HoldedIntegrationError';
  }
}

export function classifyHoldedError(status: number, path: string, body: string): HoldedApiError {
  if (status === 401) return new HoldedAuthError(path, body);
  if (status === 403) return new HoldedPermissionError(path, body);
  if (status === 429) return new HoldedRateLimitError(path);
  return new HoldedApiError(`Holded ${path} → HTTP ${status}`, status, path, body);
}

export function holdedErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
