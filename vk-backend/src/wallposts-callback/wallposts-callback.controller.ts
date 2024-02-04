import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';
import { WallpostsCallbackService } from './wallposts-callback.service';

@Controller('wallposts-callback')
export class WallpostsCallbackController {
  constructor(private readonly wallpostsCallbackService: WallpostsCallbackService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  getData(@Body() body) {
    this.wallpostsCallbackService.sendMsg(body);
    return 'ok';
  }
}
