export class FinnhubApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public isRateLimit: boolean = false,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = 'FinnhubApiError';
  }
}

export interface FinnhubClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchFn?: typeof fetch;
}

export class FinnhubClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private fetchFn: typeof fetch;

  constructor(options?: FinnhubClientOptions) {
    const rawKey = options?.apiKey ?? (typeof process !== 'undefined' ? process.env?.FINNHUB_API_KEY : '');
    this.apiKey = (rawKey || '').trim();

    const rawUrl = options?.baseUrl ?? (typeof process !== 'undefined' ? process.env?.FINNHUB_BASE_URL : '');
    this.baseUrl = (rawUrl || 'https://finnhub.io/api/v1').replace(/\/+$/, '');

    this.timeoutMs = options?.timeoutMs ?? 7000;
    this.maxRetries = options?.maxRetries ?? 2;
    this.fetchFn = options?.fetchFn ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any));
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length >= 8);
  }

  public getMaskedKey(): string {
    if (!this.apiKey) return 'Not Configured';
    if (this.apiKey.length <= 6) return '***';
    return `${this.apiKey.slice(0, 3)}••••••••${this.apiKey.slice(-3)}`;
  }

  public redact(text: string): string {
    if (!text) return '';
    let result = text;
    if (this.apiKey) {
      result = result.split(this.apiKey).join('[REDACTED_FINNHUB_TOKEN]');
    }
    // Redact any query param token
    result = result.replace(/([?&]token=)[^&]+/gi, '$1[REDACTED_FINNHUB_TOKEN]');
    return result;
  }

  public async request<T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new FinnhubApiError(
        'Finnhub API key is not configured in backend environment (.env: FINNHUB_API_KEY).',
        401,
        endpoint,
        false,
        true
      );
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    }

    let attempt = 0;
    let delay = 350;

    while (attempt <= this.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchFn(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Finnhub-Token': this.apiKey
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return data as T;
        }

        const statusCode = response.status;
        const isRateLimit = statusCode === 429;
        const isAuthError = statusCode === 401 || statusCode === 403;

        // Try reading body for error detail
        let rawBody = '';
        try {
          rawBody = await response.text();
        } catch {
          // ignore
        }

        const safeMessage = this.redact(
          `Finnhub API ${cleanEndpoint} returned HTTP ${statusCode}: ${rawBody || response.statusText}`
        );

        if (isRateLimit && attempt <= this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (statusCode >= 500 && attempt <= this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw new FinnhubApiError(safeMessage, statusCode, cleanEndpoint, isRateLimit, isAuthError);
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err instanceof FinnhubApiError) {
          throw err;
        }

        const isAbort = err?.name === 'AbortError';
        const message = isAbort
          ? `Finnhub API request timed out after ${this.timeoutMs}ms on ${cleanEndpoint}`
          : `Network error connecting to Finnhub: ${err?.message || 'Unknown network error'}`;

        if (attempt <= this.maxRetries && !isAbort) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw new FinnhubApiError(this.redact(message), isAbort ? 504 : 503, cleanEndpoint);
      }
    }

    throw new FinnhubApiError(`Max retries exceeded for ${cleanEndpoint}`, 503, cleanEndpoint);
  }
}

