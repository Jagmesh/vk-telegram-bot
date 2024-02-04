import { Body, Injectable } from '@nestjs/common';
import { LogService } from '../log/log.service';
import { TelegramService } from '../telegram/telegram.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { CACHE_KEYS } from './wallpost-callback.constants';

@Injectable()
export class WallpostsCallbackService {
  constructor(
    private readonly logService: LogService,
    private readonly telegram: TelegramService,
    private readonly cache: CacheStorageService,
  ) {
    this.logService.setScope('WALLPOSTS_CALLBACK');
  }

  async sendMsg(@Body() body: IWallPost) {
    this.logService.write(`Получили новый запрос! \n Полученный полный объект запроса: ${JSON.stringify(body)}`);

    this.telegram.create(process.env.TELEGRAM_BOT_API_TOKEN, process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_ADMIN_USER_ID);

    if (body.object.post_type !== 'post') {
      this.logService.write(`Получили post_type: ${body.object.post_type}. Пропускаем`);
      return;
    }

    if (body.object.donut.is_donut) {
      this.logService.write(`Получили is_donut: ${body.object.donut.is_donut}. Пропускаем`);
      return;
    }

    if (body.object.marked_as_ads) {
      this.logService.write(`Получили marked_as_ads: ${body.object.marked_as_ads}. Пропускаем`);
      return;
    }

    await this.telegram.sendAlert(JSON.stringify(body, null, 2));

    const samePostId = await this.cache.get(`${CACHE_KEYS.EVENT_ID}_${body.event_id}`);
    if (samePostId) {
      this.logService.error(`Пост с таким id (${body.event_id}) уже был. Пропускаем`);
      await this.telegram.sendAlert(`Пост с таким id (${body.event_id}) уже был. Пропускаем`);
      return;
    }
    await this.cache.set(`${CACHE_KEYS.EVENT_ID}_${body.event_id}`, true);

    if (!body.object.attachments.length) {
      this.logService.error(`В посте нет вложений. Пропускаем`);
      return;
    }

    for (const element of body.object.attachments) {
      if (element.doc && body.object.text) {
        await this.telegram.sendDocument(element.doc.url, body.object.text, true);
      }
    }
  }
}
