import { Module } from '@nestjs/common';
import { TelegrafBotService } from './telegraf-bot.service';
import { LogModule } from '../log/log.module';
import { TelegramModule } from '../telegram/telegram.module';
import { CacheStorageModule } from '../cache-storage/cache-storage.module';

@Module({
  imports: [LogModule, TelegramModule, CacheStorageModule],
  providers: [TelegrafBotService],
})
export class TelegrafBotModule {}
