import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RequestWithIp = {
  ip?: string;
  headers: {
    'x-forwarded-for'?: string | string[];
  };
};

const windowMs = 60_000;
const maxAttempts = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithIp>();
    const key = getClientKey(request);
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      throw new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    return true;
  }
}

function getClientKey(request: RequestWithIp): string {
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  return forwardedValue?.split(',')[0]?.trim() || request.ip || 'unknown';
}
