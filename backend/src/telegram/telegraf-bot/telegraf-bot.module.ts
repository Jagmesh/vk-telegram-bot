import { Module } from '@nestjs/common';
import { TelegrafBotService } from './telegraf-bot.service';
import { LogModule } from '../../log/log.module';
import { VkModule } from '../../vk/vk.module';
import { TelegramModule } from '../telegram.module';
import { CacheStorageModule } from '../../cache-storage/cache-storage.module';

@Module({
  imports: [LogModule, TelegramModule, CacheStorageModule, VkModule],
  providers: [TelegrafBotService],
})
export class TelegrafBotModule {}
