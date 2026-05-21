import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: process.env.JWT_SECRET ?? 'development-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'accessToken',
}));
