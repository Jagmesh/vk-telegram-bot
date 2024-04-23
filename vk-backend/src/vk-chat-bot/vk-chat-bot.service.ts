import { Injectable } from '@nestjs/common';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';
import * as fs from 'fs';
import { ConverterService } from '../converter/converter.service';
import { ConverterError } from '../converter/converter.error';

@Injectable()
export class VkChatBotService {
  constructor(
    private readonly vkService: VkService,
    private readonly logService: LogService,
    private readonly converterService: ConverterService,
  ) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  async start(): Promise<void> {
    this.vkService.vk.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') return;
      if (!context.text) return;
      const url = context.text;

      const youtubeUrlRegexp =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!youtubeUrlRegexp.test(url)) return this.logService.error('Provided text doesnt match youtube url regexp');

      await context.send('Запрос получен');
      const conversionResult = await this.converterService
        .mp4ToGif(url)
        .then((res) => res)
        .catch(async (err) => {
          this.logService.error(err);
          if (err instanceof ConverterError) await context.send(err.message);
        });
      if (!conversionResult) {
        await context.send('Не удалось обработать видео');
        return this.logService.error('Failed to process video');
      }
      const { filePath, videoTitle } = conversionResult;

      this.logService.write('File is ready. Sending');
      await context.sendDocuments({ value: filePath, filename: `gifntext_${videoTitle}.gif` });
      this.logService.write('File sent successfully');
      fs.unlink(filePath, (err) => (err ? this.logService.error(err.message) : ''));
      await context.send('Ржыте наз доровье!');
    });

    await this.vkService.vk.updates.start();
  }
}
