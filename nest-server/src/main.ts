import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

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
  await app.listen(3001);
}
bootstrap();
