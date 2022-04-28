import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: true, exposedHeaders: "*" });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
