import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { LoginDto, SignUpDto, AuthEvent } from '@repo/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async generateToken(user: { id: string; email: string; role: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Note: expiresIn is already set in module config, no need to pass again
    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, metadata?: { ipAddress: string; userAgent: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Emit login failed event
      if (metadata) {
        const failedEvent: AuthEvent = {
          entityType: 'User',
          action: 'LOGIN_FAILED',
          outcome: 'DENIED',
          metadata,
          changes: {
            email: loginDto.email,
          },
        };
        this.eventEmitter.emit('auth.login.failed', failedEvent);
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateToken(user);

    // Emit login success event
    if (metadata) {
      const successEvent: AuthEvent = {
        entityType: 'User',
        entityId: user.id,
        action: 'LOGIN',
        actorId: user.id,
        outcome: 'SUCCESS',
        metadata,
      };
      this.eventEmitter.emit('auth.login', successEvent);
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async signup(signUpDto: SignUpDto, metadata?: { ipAddress: string; userAgent: string }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signUpDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: signUpDto.email.toLowerCase(),
        password: hashedPassword,
        name: signUpDto.name,
        role: 'MEMBER', // Default role
      },
    });

    const accessToken = await this.generateToken(user);

    // Emit signup event
    if (metadata) {
      const signupEvent: AuthEvent = {
        entityType: 'User',
        entityId: user.id,
        action: 'SIGNUP',
        actorId: user.id,
        outcome: 'SUCCESS',
        metadata,
      };
      this.eventEmitter.emit('auth.signup', signupEvent);
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
