import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../types/jwt-payload';

type RequestWithOptionalUser = {
  cookies?: Record<string, string | undefined>;
  headers: {
    cookie?: string | string[];
  };
  user?: JwtPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithOptionalUser>();
    const token = this.getTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('app.jwtSecret'),
      });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getTokenFromCookie(request: RequestWithOptionalUser): string | undefined {
    const cookieName = this.configService.get<string>('app.authCookieName', 'accessToken');
    const parsedCookie = request.cookies?.[cookieName];

    if (parsedCookie) {
      return parsedCookie;
    }

    return parseCookieHeader(request.headers.cookie)[cookieName];
  }
}

function parseCookieHeader(cookieHeader: string | string[] | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const normalizedCookieHeader = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;

  return normalizedCookieHeader.split(';').reduce<Record<string, string>>((cookies, cookie) => {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    if (name) {
      cookies[name] = decodeCookieValue(value);
    }

    return cookies;
  }, {});
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
