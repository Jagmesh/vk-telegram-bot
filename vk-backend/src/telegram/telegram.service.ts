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

  create(apiToken: string, chatID: string, adminID: string) {
    this.telegram = new Telegram(apiToken);
    this.chatID = chatID;
    this.adminID = adminID;
  }

  async sendMessage(text: string) {
    try {
      await this.telegram.sendMessage(this.chatID, text, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  async sendSticker(file_id: string) {
    try {
      await this.telegram.sendSticker(this.chatID, file_id);
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  async sendAlert(text: string) {
    try {
      await this.telegram.sendMessage(this.adminID, text, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logService.error(`Ошибка: ${error}`);
    }
  }

  async sendDocument(url: string, caption: string, resend: boolean) {
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
