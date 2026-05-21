import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login-req.dto';
import { LoginResponseDto } from './dto/user-login-res.dto';

type CookieResponse = {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
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
}
