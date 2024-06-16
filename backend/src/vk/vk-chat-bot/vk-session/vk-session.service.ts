import { Injectable } from '@nestjs/common';
import { CacheStorageService } from '../../../cache-storage/cache-storage.service';

@Injectable()
export class VkSessionService {
  constructor(private readonly cache: CacheStorageService) {}

  save<T>(chatId: number, sessionData: T) {
    return this.cache.set(`chatId:${chatId}`, sessionData);
  }

  get<T>(chatId: number): Promise<T> {
    return this.cache.get<T>(`chatId:${chatId}`);
  }
}
