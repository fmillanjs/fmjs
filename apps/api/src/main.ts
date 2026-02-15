import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  app.enableCors({
    origin: nextAuthUrl,
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`
🚀 TeamFlow API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API:     http://localhost:${port}/api
  Swagger: http://localhost:${port}/api/docs
  Health:  http://localhost:${port}/api/health

  Environment: ${process.env.NODE_ENV || 'development'}
  CORS Origin: ${nextAuthUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

bootstrap();
