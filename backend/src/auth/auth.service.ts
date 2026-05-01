import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(data: { name: string; email: string; password: string; phone?: string; institution?: string; level?: string; address?: string }) {
    const existing = await this.users.findByEmail(data.email);
    if (existing) throw new ConflictException('এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.users.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      phone: data.phone,
      institution: data.institution,
      level: data.level,
      address: data.address,
      role: 'student',
    });
    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) throw new UnauthorizedException('ইমেইল বা পাসওয়ার্ড ভুল');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('ইমেইল বা পাসওয়ার্ড ভুল');
    return this.signToken(user);
  }

  private signToken(user: any) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      token: this.jwt.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        institution: user.institution,
        level: user.level,
        enrolledBatches: user.enrolledBatches || [],
      },
    };
  }
}
