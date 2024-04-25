import { Module } from '@nestjs/common';
import { YtdlService } from './ytdl.service';
import { LogModule } from '../log/log.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LogModule, ConfigModule],
  providers: [YtdlService],
  exports: [YtdlService],
})
export class YtdlModule {}
