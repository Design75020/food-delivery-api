export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// ─────────────────────────────────────────────
// Predefined HTTP errors
// ─────────────────────────────────────────────

export const BadRequest = (msg = "Bad Request") => new AppError(msg, 400);
export const Unauthorized = (msg = "Unauthorized") => new AppError(msg, 401);
export const Forbidden = (msg = "Forbidden") => new AppError(msg, 403);
export const NotFound = (msg = "Not Found") => new AppError(msg, 404);
export const Conflict = (msg = "Conflict") => new AppError(msg, 409);
export const UnprocessableEntity = (msg = "Unprocessable Entity") =>
  new AppError(msg, 422);
export const InternalServerError = (msg = "Internal Server Error") =>
  new AppError(msg, 500);
