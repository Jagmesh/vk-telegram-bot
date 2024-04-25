import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { LogModule } from '../log/log.module';
import { ConfigModule } from '@nestjs/config';
import { YtdlModule } from '../ytdl/ytdl.module';

@Module({
  imports: [LogModule, ConfigModule, YtdlModule],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
