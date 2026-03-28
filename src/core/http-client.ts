export interface HttpClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
}

export type FetchHttpClientOptions = {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
};

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl?: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(options: FetchHttpClientOptions = {}) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = this.baseUrl ? new URL(path, this.baseUrl).toString() : path;

      const response = await fetch(url, {
        ...init,
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}