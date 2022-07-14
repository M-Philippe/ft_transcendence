import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
// import helmet from "helmet";
import * as fs from "fs";

async function bootstrap() {
  const privateKey = fs.readFileSync("./certs/backend.key");
  const certificate = fs.readFileSync("./certs/backend.crt");
  const httpsOptions = { key: privateKey, cert: certificate };

  const app = await NestFactory.create(AppModule, { httpsOptions: httpsOptions });
  // app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" }, hsts: false }));
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: true, exposedHeaders: "*" });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
