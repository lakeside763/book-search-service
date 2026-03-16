export type HttpResponse<T> = {
  status: number;
  data: T;
};

export interface HttpClient {
  get<T>(url: string, options?: RequestInit): Promise<HttpResponse<T>>;
}

type FetchHttpClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
};

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: FetchHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.defaultHeaders = options.defaultHeaders ?? {
      Accept: "application/json",
    };
  }

  async get<T>(url: string, options?: RequestInit): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: "GET",
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...(options?.headers ?? {}),
        },
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      let data: T;

      if (contentType.includes("application/json")) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as T;
      }

      return {
        status: response.status,
        data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}