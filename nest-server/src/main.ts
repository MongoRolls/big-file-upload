import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import * as session from 'express-session';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.use(
    session({
      secret: 'xxxx',
      name: 'xc.session', // 生成客户端cookie的名称
      rolling: true, // 每次请求都更新cookie
      cookie: { maxAge: null }, // 设置cookie的过期时间
    }),
  );
  await app.listen(3000);
}
bootstrap();
