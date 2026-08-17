import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { User } from '../database/entities/user.entity';
import { EmployeeProfile } from '../database/entities/employee_profile.entity';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(EmployeeProfile) private readonly employeeProfileRepo: Repository<EmployeeProfile>,
  ) {}

  @Get()
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const userId = (req.session as any).user?.id;
    const user = await this.userRepo.findOneBy({ id: userId });
    const employeeProfile = await this.employeeProfileRepo.findOneBy({ user_id: userId });
    return res.render('profile', {
      pageTitle: 'Profile',
      user,
      employeeProfile,
      success: null,
      error: null,
    });
  }

  @Post()
  async updateProfile(
    @Body()
    body: {
      display_name?: string;
      username?: string;
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
      employee_title?: string;
      employee_department?: string;
    },
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
        const employeeProfile = await this.employeeProfileRepo.findOneBy({ user_id: userId });
        return res.render('profile', {
          pageTitle: 'Profile',
          user,
          employeeProfile,
          success: null,
          error: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว',
        });
      }
    }

    const update: Partial<User> = {};
    if (body.display_name !== undefined) update.display_name = body.display_name;
    if (body.username)                   update.username     = body.username;
    if (body.email)                      update.email        = body.email;
    if (body.password)                   update.password     = await bcrypt.hash(body.password, 10);

    await this.userRepo.update(userId, update);

    const employeeUpdate = {
      first_name: body.first_name ?? '',
      last_name: body.last_name ?? '',
      employee_title: body.employee_title || null,
      employee_department: body.employee_department || null,
    };
    const existingProfile = await this.employeeProfileRepo.findOneBy({ user_id: userId });
    if (existingProfile) {
      await this.employeeProfileRepo.update(existingProfile.id, employeeUpdate);
    } else {
      await this.employeeProfileRepo.save(this.employeeProfileRepo.create({ user_id: userId, ...employeeUpdate }));
    }

    const updated = await this.userRepo.findOneBy({ id: userId });
    const updatedEmployeeProfile = await this.employeeProfileRepo.findOneBy({ user_id: userId });
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
      employeeProfile: updatedEmployeeProfile,
      success: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      error: null,
    });
  }
}
