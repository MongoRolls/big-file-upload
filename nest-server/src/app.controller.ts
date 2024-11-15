import { Controller, Get, Version } from '@nestjs/common';
import { AppService } from './app.service';

// 对整个控制器进行版本控制
// @Controller({
//   path: 'api',
//   version: '1', // 此时接口变为 /v1/api/xxx
//   // ... other options
// })
@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}
  // 也可以对某个接口进行版本控制
  @Get('/get')
  @Version('1') // 此时接口变为 /v1/api/get
  getHello(): string {
    return this.appService.getHello();
  }
}
