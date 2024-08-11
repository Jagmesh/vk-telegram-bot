import { Module } from '@nestjs/common';
import { YtDlpService } from './yt-dlp.service';
import { VkModule } from '../vk/vk.module';
import { ConfigModule } from '@nestjs/config';
import { LogModule } from '../log/log.module';
import { WebScraperModule } from '../web-scraper/web-scraper.module';

@Module({
  imports: [VkModule, ConfigModule, LogModule, WebScraperModule],
  providers: [YtDlpService],
  exports: [YtDlpService],
})
export class YtDlpModule {}
