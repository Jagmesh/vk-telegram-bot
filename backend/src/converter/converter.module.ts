import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { LogModule } from '../log/log.module';
import { ConfigModule } from '@nestjs/config';
import { YtDlpModule } from '../yt-dlp/yt-dlp.module';

@Module({
  imports: [LogModule, ConfigModule, YtDlpModule],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
