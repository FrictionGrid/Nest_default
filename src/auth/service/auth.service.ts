import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async validateUser(username: string, password: string): Promise<{ id: number; username: string; role: string }> {
    const user = await this.userRepo.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: replace with bcrypt.compare when password is hashed
    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, username: user.username, role: user.role };
  }
}
