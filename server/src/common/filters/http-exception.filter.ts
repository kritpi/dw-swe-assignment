import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorCode } from '../errors/error-code';

type HttpResponse = {
  status(statusCode: number): HttpResponse;
  json(body: unknown): void;
};

type HttpRequest = {
  url?: string;
};

type ExceptionResponse = {
  code?: string;
  message?: string | string[];
  error?: string;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    const request = context.getRequest<HttpRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const normalized = normalizeExceptionResponse(exceptionResponse, status);

    response.status(status).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      },
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

function normalizeExceptionResponse(response: string | object | null, status: number) {
  if (typeof response === 'string') {
    return {
      code: codeForStatus(status),
      message: response,
      details: undefined,
    };
  }

  const body = (response ?? {}) as ExceptionResponse;
  const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;

  return {
    code: body.code ?? codeForStatus(status),
    message: message ?? body.error ?? 'Unexpected error',
    details: body.details ?? (Array.isArray(body.message) ? body.message : undefined),
  };
}

function codeForStatus(status: number): ErrorCode {
  if (status === HttpStatus.BAD_REQUEST) {
    return ErrorCode.ValidationFailed;
  }

  if (status === HttpStatus.UNAUTHORIZED) {
    return ErrorCode.AuthenticationRequired;
  }

  if (status === HttpStatus.FORBIDDEN) {
    return ErrorCode.Forbidden;
  }

  if (status === HttpStatus.NOT_FOUND) {
    return ErrorCode.NotFound;
  }

  return ErrorCode.InternalError;
}
