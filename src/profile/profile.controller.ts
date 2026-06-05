import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request, Response } from 'express';
import { User } from '../database/entities/user.entity';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const userId = (req.session as any).user?.id;
    const user = await this.userRepo.findOneBy({ id: userId });
    return res.render('profile', {
      pageTitle: 'Profile',
      user,
      success: null,
      error: null,
    });
  }

  @Post()
  async updateProfile(
    @Body() body: { display_name?: string; username?: string; email?: string; password?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = (req.session as any).user?.id;

    if (body.username || body.email) {
      const conflict = await this.userRepo
        .createQueryBuilder('u')
        .where('u.id != :id', { id: userId })
        .andWhere('(u.username = :username OR u.email = :email)', {
          username: body.username ?? '',
          email: body.email ?? '',
        })
        .getOne();

      if (conflict) {
        const user = await this.userRepo.findOneBy({ id: userId });
        return res.render('profile', {
          pageTitle: 'Profile',
          user,
          success: null,
          error: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว',
        });
      }
    }

    const update: Partial<User> = {};
    if (body.display_name !== undefined) update.display_name = body.display_name;
    if (body.username)                   update.username     = body.username;
    if (body.email)                      update.email        = body.email;
    if (body.password)                   update.password     = body.password;

    await this.userRepo.update(userId, update);

    const updated = await this.userRepo.findOneBy({ id: userId });
    if (updated) {
      (req.session as any).user = {
        ...(req.session as any).user,
        display_name: updated.display_name,
        username:     updated.username,
      };
    }

    return res.render('profile', {
      pageTitle: 'Profile',
      user: updated,
      success: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      error: null,
    });
  }
}
