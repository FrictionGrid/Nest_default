import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async validateUser(username: string, password: string): Promise<{ id: number; username: string; display_name: string; role: string }> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.password.startsWith('$2b$')) {
      // hash แล้ว → ใช้ bcrypt.compare
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
    } else {
      // ยัง plaintext → เช็คตรงๆ แล้ว hash ทับอัตโนมัติ
      if (user.password !== password) throw new UnauthorizedException('Invalid credentials');
      user.password = await bcrypt.hash(password, 10);
      await this.userRepo.save(user);
    }

    return { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
  }
}
