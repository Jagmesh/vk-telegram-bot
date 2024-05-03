import { Module } from '@nestjs/common';
import { YoutubeDownloadService } from './youtube-download.service';
import { LogModule } from '../log/log.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LogModule, ConfigModule],
  providers: [YoutubeDownloadService],
  exports: [YoutubeDownloadService],
})
export class YoutubeDownloadModule {}
