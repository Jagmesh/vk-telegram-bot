import { Injectable, Scope } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { LogService } from '../log/log.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { defer, retry } from 'rxjs';
import { MESSAGE_ID_PREFIX } from '../telegraf-bot/telegraf-bot.consts';

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
      this.logService.error(`Error: ${error}`);
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

  async sendDocument(url: string, caption: string): Promise<void> {
    defer(() =>
      this._telegraf.telegram.sendDocument(this._chatID, url, {
        caption,
      }),
    )
      .pipe(retry({ count: 3, delay: 5 * 1000 }))
      .subscribe({
        next: async (value) => {
          if (value?.message_id) await this.cache.set(`${MESSAGE_ID_PREFIX}_${value.message_id}`, { text: caption });
        },
        error: (error) => {
          const errMessage = `Error: ${error}. File url: ${url}`;
          this.logService.error(errMessage);
          this.sendAlert(errMessage);
        },
      });
  }

  get telegraf() {
    return this._telegraf;
  }
}
