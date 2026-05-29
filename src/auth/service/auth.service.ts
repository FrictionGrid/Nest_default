import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable() // คำสั่งเพื่อประกาศให้สามารถเอาคลาสนี้ไปใช้ต่อได้
export class AuthService { 
  constructor(
    @InjectRepository(User) // ดึง table db มาใช้
    private readonly userRepo: Repository<User>, // ดึง qurrey db มาเก็บใน userRepo
  ) {}
// type script ต้องประกาศทั้งตัวเเปรขาเข้าเเล้วออก
  async validateUser(username: string, password: string): Promise<{ id: number; username: string; display_name: string; role: string }> {
//  เจอที่เหมือนส่งค่ามา ไม่มีคืน null
  const user = await this.userRepo.findOne({ where: { username } });
    // user = null
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ไม่ตรง password ส่ง erro
    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // ตรงหมดเอาค่าที่ต้องการไปใช้ต่อ
    return { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
  }
}
