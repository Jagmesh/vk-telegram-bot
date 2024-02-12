import { Body, Injectable } from '@nestjs/common';
import { LogService } from '../log/log.service';
import { TelegramService } from '../telegram/telegram.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { CACHE_KEYS } from './wallpost-callback.constants';
import { VK } from 'vk-io';
import { VkService } from '../vk/vk.service';
import * as process from 'process';

@Injectable()
export class WallpostsCallbackService {
  constructor(
    private readonly logService: LogService,
    private readonly telegram: TelegramService,
    private readonly cache: CacheStorageService,
    private readonly vk: VkService,
  ) {
    this.logService.setScope('WALLPOSTS_CALLBACK');
  }

  async sendMsg(@Body() body: IWallPost): Promise<void> {
    this.logService.write(`Получили новый запрос! \n Полученный полный объект запроса: ${JSON.stringify(body)}`);
    const userId = body.object.created_by;

    this.telegram.create(process.env.TELEGRAM_BOT_API_TOKEN, process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_ADMIN_USER_ID);

    const userIsDon = await this.vk.checkIfDonById(userId, process.env.VK_GROUP_ID);
    if (userIsDon && body.object.post_type === 'suggest') {
      this.logService.write(`Пост в предложке от Дона (id ${userId}). Отправляем уведомление`);

      const userFullName = await this.vk.getUserFullName(userId);

      await this.vk.sendMessage(`Дон ${userFullName} (id ${userId}) отправил пост в предложку: \n\n` + `${body.object.text}`, 30152694, {
        attachment: `doc${body.object.attachments[0].doc.owner_id}_${body.object.attachments[0].doc.id}`,
      });

      return;
    }

    if (body.object.donut.is_donut) {
      this.logService.write(`Получили пост для донов (is_donut: ${body.object.donut.is_donut}). Пропускаем`);
      return;
    }

    if (body.object.post_type !== 'post') {
      this.logService.write(`Получили post_type: ${body.object.post_type}. Пропускаем`);
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
