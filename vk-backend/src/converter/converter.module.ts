import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { LogModule } from '../log/log.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LogModule, ConfigModule],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
