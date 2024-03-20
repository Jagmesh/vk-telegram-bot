import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LogModule } from '../log/log.module';
import { CacheStorageModule } from '../cache-storage/cache-storage.module';

@Module({
  imports: [LogModule, CacheStorageModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
