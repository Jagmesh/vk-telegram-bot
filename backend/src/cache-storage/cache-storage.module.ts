import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheStorageService } from './cache-storage.service';
import { LogModule } from '../log/log.module';
import * as memcachedStore from 'cache-manager-memcached-store';
import * as Memcache from 'memcache-pp';
import mainGlobalConfig from '../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';
import { LogService } from '../log/log.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [mainGlobalConfig.KEY],
      useFactory: async (mainConfig: ConfigType<typeof mainGlobalConfig>) => ({
        store: memcachedStore,
        driver: Memcache,
        options: {
          hosts: [`${mainConfig.MEMCACHED_HOST}:${mainConfig.MEMCACHED_PORT}`],
        },
        ttl: mainConfig.MEMCACHED_DEFAULT_TTL,
      }),
    }),
    LogModule,
  ],
  providers: [CacheStorageService],
  exports: [CacheStorageService],
})
export class CacheStorageModule {
  constructor(logService: LogService) {
    logService.setScope('CACHE_MODULE').write(`Successfully connected to MemCache`);
  }
}
