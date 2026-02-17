import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Required: populate req.cookies for JWT cookie extraction in CaslAuthGuard
  app.use(cookieParser());

  // CORS for devcollab-web (port 3002 → port 3003 cross-origin)
  // credentials: true is required for httpOnly cookies to be sent cross-origin
  app.enableCors({
    origin: process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002',
    credentials: true,
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`DevCollab API running on port ${port}`);
}

bootstrap();
