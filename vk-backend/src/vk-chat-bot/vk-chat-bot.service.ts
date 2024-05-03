import { Injectable } from '@nestjs/common';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';
import * as fs from 'fs';
import { ConverterService } from '../converter/converter.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigService } from '@nestjs/config';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { YoutubeDownloadService } from '../youtube-download/youtube-download.service';
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

  async start(): Promise<void> {
    this.vkService.vk.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') return;
      if (!context.text && !context.attachments) return;

      if (context.text) {
        return await this.handleTextMessage(context.text, context);
      }

      const links = context.getAttachments('link');
      if (links && links.length) {
        const link = links[0];
        return await this.handleTextMessage(link.url, context);
      }

      const videos = context.getAttachments('video');
      if (videos && videos.length) {
        const video = videos[0];
        return await this.processVideo(`${video.ownerId}_${video.id}_${video.accessKey}`, 'vkVideo', context);
      }

      // if (context.attachments) {
      //   return await this.processVideo(context.getAttachments('doc')[0].url, 'vkAttachment', context);
      // }
    });

    await this.vkService.vk.updates.start();
  }

  private async handleTextMessage(text: string, context: MessageContext<ContextDefaultState>) {
    if (text.startsWith('/')) return await this.handleTextCommands(text.replace(/[^a-zA-Z]/g, ''), context);

    const youtubeUrlRegexp = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeUrlRegexp.test(text)) return this.logService.error('Provided text doesnt match youtube url regexp');

    return await this.processVideo(text, 'youtube', context);
  }

  private async handleTextCommands(command: string, context: MessageContext<ContextDefaultState>) {
    if (command === 'help') {
      return await context.send(
        'ГИФКОБОТ\n\n• Пока что доступен варик только с видосами с ютуба\n' +
          '• Чтобы получить гифку достаточно просто скинуть ссылку на видос на ютубе\n' +
          '• Важно, чтобы ссылка была как текст, а не как вложение\n' +
          `• Пока что есть ограничение по длительности в ${this.configService.get('VIDEO_MAX_DURATION')} секунд`,
      );
    }
    return await context.send('Нет такой команды! Попробуй /help');
  }

  private async processVideo(url: string, type: videoConverterType, context: MessageContext<ContextDefaultState>) {
    await context.send('Запрос получен. Пожалуйста, подожди. Обработка видео может занять до 3 минут');

    const videoData = await this.converterService
      .getVideoMetadata(type, url, context)
      .then((res) => res)
      .catch(async (err) => {
        this.logService.error(`Error occurred while geting video metadata: ${err}`);
        if (err instanceof ConverterError) await context.send(err.message);
      });
    if (!videoData) {
      await context.send('Не удалось обработать видео');
      return this.logService.error('Failed to process video');
    }
    const { videoTitle, filePath } = await this.converterService.mp4ToGif(videoData);

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
}
