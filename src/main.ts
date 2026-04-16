import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const session = require('express-session');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressLayouts = require('express-ejs-layouts');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'change-this-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.use((req, res, next) => {
    res.locals.pageTitle = '';
    res.locals.pageSubtitle = '';
    next();
  });
  app.use((req, res, next) => {
    if (req.path === '/auth/login') return next();
    return expressLayouts(req, res, next);
  });
  app.set('layout', 'layouts/layout1');
  app.setViewEngine('ejs');

  app.setGlobalPrefix(process.env.APP_PREFIX ?? '');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  });

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
