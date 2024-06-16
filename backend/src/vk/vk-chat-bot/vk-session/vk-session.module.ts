import { Module } from '@nestjs/common';
import { CacheStorageModule } from '../../../cache-storage/cache-storage.module';
import { VkSessionService } from './vk-session.service';

@Module({
  imports: [CacheStorageModule],
  providers: [VkSessionService],
  exports: [VkSessionService],
})
export class VkSessionModule {}
