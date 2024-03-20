import { Injectable, Scope } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { LogService } from '../log/log.service';
import { MESSAGE_ID_PREFIX } from '../telegraf-bot/telegraf-bot.consts';
import { CacheStorageService } from '../cache-storage/cache-storage.service';

@Injectable({ scope: Scope.TRANSIENT })
export class TelegramService {
  private _telegraf: Telegraf;
  private _chatID: string;
  private _adminID: string;

  constructor(private readonly logService: LogService, private readonly cache: CacheStorageService) {
    this.logService.setScope('TELEGRAM');
  }

  create(apiToken: string, chatID: string, adminID: string): void {
    this._telegraf = new Telegraf(apiToken);
    this._chatID = chatID;
    this._adminID = adminID;
  }

  async sendMessage(text: string, chatId: string): Promise<void> {
    try {
      await this._telegraf.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  // async sendSticker(file_id: string): Promise<void> {
  //   try {
  //     await this.telegraf.telegram.sendSticker(this.chatID, file_id);
  //   } catch (error) {
  //     this.logService.error(`Ошибка: ${error}`);
  //   }
  // }

  async sendAlert(text: string): Promise<void> {
    await this.sendMessage(text, this._adminID);
  }

  async sendDocument(url: string, caption: string, resend: boolean): Promise<void> {
    try {
      const { message_id } = await this._telegraf.telegram.sendDocument(this._chatID, url, {
        caption,
      });
      await this.cache.set(`${MESSAGE_ID_PREFIX}_${message_id}`, { text: caption });
    } catch (error) {
      const errMessage = `Ошибка: ${error}. Ссылка на файл: ${url}`;
      this.logService.error(errMessage);
      await this.sendAlert(errMessage);
      if (resend) {
        this.logService.write('Отправляем запрос повторно');
        await new Promise<void>((resolve) => {
          setTimeout(async () => {
            await this.sendDocument(url, caption, false);
            resolve();
          }, 5000);
        });
      }
    }
  }

  get telegraf() {
    return this._telegraf;
  }
}
