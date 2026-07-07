/**
 * Typed application error. Carries an HTTP status and a stable machine-readable
 * `code` so the frontend can react to specific failure modes.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static payloadTooLarge(message: string) {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static unprocessable(message: string, details?: unknown) {
    return new AppError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message: string, details?: unknown) {
    return new AppError(500, 'INTERNAL_ERROR', message, details);
  }
}
