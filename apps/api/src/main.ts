import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for local development
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`API server running on http://localhost:${port}`);
}

bootstrap();
