import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheStorageService } from './cache-storage.service';
import { LogModule } from '../log/log.module';
import * as memcachedStore from 'cache-manager-memcached-store';
import * as Memcache from 'memcache-pp';

@Module({
  imports: [
    CacheModule.register({
      store: memcachedStore,
      driver: Memcache,
      options: {
        hosts: ['5.159.101.138:11211'],
      },
      ttl: 24 * 60 * 60 * 1000,
    }),
    LogModule,
  ],
  providers: [CacheStorageService],
  exports: [CacheStorageService],
})
export class CacheStorageModule {}
