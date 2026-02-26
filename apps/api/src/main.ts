import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './core/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Redis adapter for WebSocket cross-session broadcasting
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Enable CORS for Next.js frontend
  // CORS_ORIGIN is the canonical env var; NEXTAUTH_URL accepted as legacy fallback
  const corsOrigin = process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('TeamFlow API')
    .setDescription('Backend API for TeamFlow - Task Management & Collaboration Platform')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token',
    })
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('teams', 'Team/Organization management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('labels', 'Label management endpoints')
    .addTag('tasks', 'Task management endpoints')
    .addTag('comments', 'Comment management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // PORT is set by Dockerfile (4000) and standard for container runtimes
  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`
🚀 TeamFlow API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API:     http://localhost:${port}/api
  Swagger: http://localhost:${port}/api/docs
  Health:  http://localhost:${port}/api/health

  Environment: ${process.env.NODE_ENV || 'development'}
  CORS Origin: ${corsOrigin}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

bootstrap();
