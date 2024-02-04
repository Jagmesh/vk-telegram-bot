import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheStorageService } from './cache-storage.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000,
    }),
  ],
  providers: [CacheStorageService],
  exports: [CacheStorageService],
})
export class CacheStorageModule {}
