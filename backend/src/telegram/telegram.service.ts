import { Injectable, Scope } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { LogService } from '../log/log.service';
import { defer, retry } from 'rxjs';

@Injectable({ scope: Scope.TRANSIENT })
export class TelegramService {
  private _telegraf: Telegraf;
  private _chatID: string;
  private _adminID: string;

  constructor(private readonly logService: LogService) {
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

  async sendDocument(url: string, caption: string): Promise<number | void> {
    return new Promise((resolve, reject) => {
      defer(() =>
        this._telegraf.telegram.sendDocument(this._chatID, url, {
          caption,
        }),
      )
        .pipe(retry({ count: 3, delay: 5 * 1000 }))
        .subscribe({
          next: async (value) => {
            resolve(value?.message_id);
          },
          error: (error) => {
            const errMessage = `Error: ${error}. File url: ${url}`;
            this.logService.error(errMessage);
            this.sendAlert(errMessage);
            reject(errMessage);
          },
        });
    });
  }

  get telegraf() {
    return this._telegraf;
  }
}
