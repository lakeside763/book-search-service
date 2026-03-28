export class AppError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(message: string, code = "APP_ERROR", cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class ProviderError extends AppError {
  public readonly provider: string;

  constructor(provider: string, message: string, cause?: unknown) {
    super(message, "PROVIDER_ERROR", cause);
    this.provider = provider;
  }
}

export class SearchError extends AppError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, "SEARCH_ERROR", cause);
  }
}