import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('app.port');

  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.use(
    (
      _request: unknown,
      response: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      next();
    },
  );
  app.enableCors({
    origin: config.getOrThrow<string[]>('app.corsOrigins'),
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DW SWE Assignment API')
    .setDescription('API documentation for authentication, users, concerts, and reservations.')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(config.get<string>('app.authCookieName', 'accessToken'))
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
