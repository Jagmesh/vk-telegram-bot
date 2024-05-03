import { Module } from '@nestjs/common';
import { YtDlpService } from './yt-dlp.service';
import { VkModule } from '../vk/vk.module';
import { ConfigModule } from '@nestjs/config';
import { LogModule } from '../log/log.module';

@Module({
  imports: [VkModule, ConfigModule, LogModule],
  providers: [YtDlpService],
  exports: [YtDlpService],
})
export class YtDlpModule {}
