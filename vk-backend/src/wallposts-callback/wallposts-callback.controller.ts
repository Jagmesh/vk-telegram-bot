import { Controller, HttpCode, HttpStatus, Post, Body, UseInterceptors } from '@nestjs/common';
import { WallpostsCallbackService } from './wallposts-callback.service';
import { AlwaysOkInterceptor } from './wallposts-callback.interceptor';

@Controller('wallposts-callback')
export class WallpostsCallbackController {
  constructor(private readonly wallpostsCallbackService: WallpostsCallbackService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AlwaysOkInterceptor)
  getData(@Body() body) {
    if (body.type === 'wall_schedule_post_new') {
      this.wallpostsCallbackService.checkPostponesWallPost(body);
      return;
    }
    this.wallpostsCallbackService.sendMsg(body);
  }
}
