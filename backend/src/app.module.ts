import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LogModule } from './log/log.module';
import mainGlobalConfig from './common/config/main-global.config';
import { WallpostsCallbackModule } from './vk/wallposts-callback/wallposts-callback.module';
import { CacheStorageModule } from './cache-storage/cache-storage.module';
import { VkChatBotModule } from './vk/vk-chat-bot/vk-chat-bot.module';
import { TelegrafBotModule } from './telegram/telegraf-bot/telegraf-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [mainGlobalConfig] }),
    WallpostsCallbackModule,
    CacheStorageModule,
    VkChatBotModule,
    TelegrafBotModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule {}
