import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { UserLoginDto } from './dto/user-login-req.dto';
import { LoginResponseDto } from './dto/user-login-res.dto';
import type { User } from '../db/schema';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: UserLoginDto): Promise<LoginResponseDto> {
    const user = await this.validateCredentials(dto.email, dto.password, dto.role);
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    return {
      accessToken: this.jwtService.sign(jwtPayload),
    };
  }

  private async validateCredentials(email: string, password: string, role: User['role']): Promise<User> {
    const user = await this.authRepository.findByEmail(email.trim().toLowerCase());

    if (!user || !(await compare(password, user.password)) || user.role !== role) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
