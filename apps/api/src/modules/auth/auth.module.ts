import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';

        console.log('[Auth Module] JWT configured:', {
          secretPresent: !!secret,
          secretLength: secret?.length,
          expiresIn,
          algorithm: 'HS256',
        });

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any, // JWT accepts string durations like '15m', '7d'
            algorithm: 'HS256', // Explicit algorithm
          },
          verifyOptions: {
            algorithms: ['HS256'], // CRITICAL: Must match signOptions
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
