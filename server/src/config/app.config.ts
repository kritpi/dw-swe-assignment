import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: getRequiredJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'accessToken',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));

function getRequiredJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return process.env.JWT_SECRET;
}
