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
import { MessageQueueModule } from './message-queue/message-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mainGlobalConfig],
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod.env' : '.env.dev.env',
    }),
    WallpostsCallbackModule,
    CacheStorageModule,
    VkChatBotModule,
    TelegrafBotModule,
    LogModule,
    MessageQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule {}
