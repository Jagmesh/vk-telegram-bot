import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LogModule } from '../log/log.module';

@Module({
  imports: [LogModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
