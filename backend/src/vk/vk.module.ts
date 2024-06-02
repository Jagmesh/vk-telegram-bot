import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { LogModule } from '../log/log.module';

@Module({
  imports: [LogModule],
  providers: [VkService],
  exports: [VkService],
})
export class VkModule {}
