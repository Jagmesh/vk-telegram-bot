import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LogService } from '../log/log.service';

@Injectable()
export class CacheStorageService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache, private readonly logService: LogService) {
    this.logService.setScope('CACHE_STORAGE');
  }

  async get(key): Promise<any> {
    this.logService.write(`Getting data from ${key}`);
    return JSON.parse(await this.cache.get(key));
  }

  async set(key, value): Promise<void> {
    this.logService.write(`Saving data in ${key}: ${JSON.stringify(value)}`);
    await this.cache.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    return await this.cache.del(key);
  }
}
