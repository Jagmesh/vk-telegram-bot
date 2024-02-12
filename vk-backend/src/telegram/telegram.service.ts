import { Injectable, Scope } from '@nestjs/common';
import { Telegram } from 'telegraf';
import { LogService } from '../log/log.service';

@Injectable({ scope: Scope.TRANSIENT })
export class TelegramService {
  telegram: Telegram;
  chatID: string;
  adminID: string;

  constructor(private readonly logService: LogService) {
    this.logService.setScope('TELEGRAM');
  }

  create(apiToken: string, chatID: string, adminID: string): void {
    this.telegram = new Telegram(apiToken);
    this.chatID = chatID;
    this.adminID = adminID;
  }

  async sendMessage(text: string, chatId: string): Promise<void> {
    try {
      await this.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  async sendSticker(file_id: string): Promise<void> {
    try {
      await this.telegram.sendSticker(this.chatID, file_id);
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  async sendAlert(text: string): Promise<void> {
    await this.sendMessage(text, this.adminID);
  }

  async sendDocument(url: string, caption: string, resend: boolean): Promise<void> {
    try {
      await this.telegram.sendDocument(this.chatID, url, {
        caption,
      });
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
}
