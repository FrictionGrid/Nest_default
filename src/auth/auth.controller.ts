import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './service/auth.service';
import { ROLE_DEFAULT_PAGE } from '../common/constants/role-permissions';

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  loginPage(@Req() req: Request, @Res() res: Response) {
    if ((req.session as any)?.user) {
      return res.redirect('/overview-project');
    }
    res.locals.layout = false;
    return res.render('login');
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(body.username, body.password);
      (req.session as any).user = user;
      const redirect = ROLE_DEFAULT_PAGE[user.role] ?? '/overview-project';
      return res.json({ success: true, redirect });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.redirect('/auth/login');
    });
  }
}
