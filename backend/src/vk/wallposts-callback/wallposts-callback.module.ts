import { Module } from '@nestjs/common';
import { WallpostsCallbackController } from './wallposts-callback.controller';
import { WallpostsCallbackService } from './wallposts-callback.service';
import { TelegramModule } from '../../telegram/telegram.module';
import { LogModule } from '../../log/log.module';
import { CacheStorageModule } from '../../cache-storage/cache-storage.module';
import { VkModule } from '../vk.module';

@Module({
  imports: [LogModule, TelegramModule, CacheStorageModule, VkModule],
  controllers: [WallpostsCallbackController],
  providers: [WallpostsCallbackService],
})
export class WallpostsCallbackModule {}
