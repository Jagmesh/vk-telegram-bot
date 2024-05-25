import { Injectable } from '@nestjs/common';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';
import * as fs from 'fs';
import { ConverterService } from '../converter/converter.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigService } from '@nestjs/config';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { videoConverterType } from '../converter/converter.types';

@Injectable()
export class VkChatBotService {
  constructor(
    private readonly vkService: VkService,
    private readonly logService: LogService,
    private readonly converterService: ConverterService,
    private readonly configService: ConfigService,
  ) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  public async processVideo(url: string, type: videoConverterType, context: MessageContext<ContextDefaultState>) {
    await context.send('Запрос получен. Пожалуйста, подожди. Обработка видео может занять до 3 минут');

    const videoData = await this.converterService
      .getVideoMetadata(type, url, context)
      .then((res) => res)
      .catch(async (err) => {
        this.logService.error(`Error occurred while geting video metadata: ${err}`);
        if (err instanceof ConverterError) await context.send(err.message);
      });
    if (!videoData) return await this.failedToProcessVideoHandler(context);

    const conversionResult = await this.converterService
      .mp4ToGif(videoData)
      .then((res) => res)
      .catch(async (err) => {
        this.logService.error(`Error occurred while converting videoStream to gif: ${err}`);
        if (err instanceof ConverterError) await context.send(err.message);
      });
    if (!conversionResult) return await this.failedToProcessVideoHandler(context);
    const { videoTitle, filePath } = conversionResult;

    this.logService.write('File is ready. Sending');
    const attachment = await this.vkService.vk.upload.wallDocument({
      group_id: Number(this.configService.get('VK_GROUP_ID')),
      source: {
        value: filePath,
        filename: `gifntext_${videoTitle}.gif`,
      },
    });
    this.logService.write('File has been successfully uploaded to VK. Sending to user');
    await this.vkService.vk.api.messages.send({
      random_id: Math.floor(Math.random() * 10000) * Date.now(),
      peer_id: context.peerId,
      attachment,
    });
    this.logService.write('File sent successfully');
    fs.unlink(filePath, (err) => (err ? this.logService.error(err.message) : ''));
    await context.send('Ржыте наз доровье!');
  }

  private async failedToProcessVideoHandler(context: MessageContext<ContextDefaultState>) {
    await context.send(
      'Не удалось обработать видео\n\nЕсли это youtube видео, то, скорее всего, проблема во временных сетевых ограничениях от самого youtube ¯_(ツ)_/¯',
    );
    return this.logService.error('Failed to process video conversion');
  }
}
