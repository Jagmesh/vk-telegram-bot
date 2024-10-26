import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LogService } from '../log/log.service';

@Injectable()
export class CacheStorageService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache, private readonly logService: LogService) {
    this.logService.setScope('CACHE_STORAGE');
  }

  async getKeys(pattern?: string): Promise<string[]> {
    return this.cache.store.keys(pattern);
  }

  async get<T>(key): Promise<T> {
    this.logService.write(`Getting data from ${key}`);
    return JSON.parse(await this.cache.get(key));
  }

  async set<T>(key, value: T): Promise<void> {
    this.logService.write(`Saving data in ${key}: ${JSON.stringify(value)}`);
    await this.cache.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.logService.write(`Deleting data by key: ${key}`);
    return await this.cache.del(key);
  }
}
