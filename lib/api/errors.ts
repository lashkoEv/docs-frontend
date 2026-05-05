export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  correlationId?: string;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: string | string[];
  readonly correlationId?: string;

  constructor(body: ApiErrorBody) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    super(message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.error;
    this.details = body.message;
    this.correlationId = body.correlationId;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;