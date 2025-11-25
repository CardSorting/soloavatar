/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code?: string) {
    super(message, 400, true, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, true, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, true, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, false, code);
  }
}

