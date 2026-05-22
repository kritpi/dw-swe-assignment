import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-code';

export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
