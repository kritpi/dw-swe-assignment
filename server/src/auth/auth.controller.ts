import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login-req.dto';
import { LoginResponseDto } from './dto/user-login-res.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottleGuard } from './guards/login-throttle.guard';
import type { AuthenticatedRequest } from './types/authenticated-request';
import type { JwtPayload } from './types/jwt-payload';

type CookieResponse = {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie(name: string, options?: Record<string, unknown>): void;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @UseGuards(LoginThrottleGuard)
  @HttpCode(200)
  async login(
    @Body() loginDto: UserLoginDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<LoginResponseDto> {
    const loginResponse = await this.authService.login(loginDto);

    response.cookie(this.config.get<string>('app.authCookieName', 'accessToken'), loginResponse.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('app.nodeEnv') === 'production',
    });

    return loginResponse;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: CookieResponse): void {
    response.clearCookie(this.config.get<string>('app.authCookieName', 'accessToken'), {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('app.nodeEnv') === 'production',
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): JwtPayload {
    return request.user;
  }
}
