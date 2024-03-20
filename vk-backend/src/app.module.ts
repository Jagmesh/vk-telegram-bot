import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WallpostsCallbackModule } from './wallposts-callback/wallposts-callback.module';
import { CacheStorageModule } from './cache-storage/cache-storage.module';
import { VkChatBotModule } from './vk-chat-bot/vk-chat-bot.module';
import { TelegrafBotModule } from './telegraf-bot/telegraf-bot.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LogModule } from './log/log.module';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
