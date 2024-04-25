import { Injectable } from '@nestjs/common';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';
import * as fs from 'fs';
import { ConverterService } from '../converter/converter.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigService } from '@nestjs/config';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { YtdlService } from '../ytdl/ytdl.service';
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
      // console.log(context)

      if (context.text) {
        const url = context.text;
        const youtubeUrlRegexp =
          /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        if (!youtubeUrlRegexp.test(url)) return this.logService.error('Provided text doesnt match youtube url regexp');

        return await this.processVideo(url, 'youtube', context);
      }

      if (context.attachments) {
        console.log(context.attachments[0]);
        return await this.processVideo(context.getAttachments('doc')[0].url, 'vkAttachment', context);
      }
    });

    await this.vkService.vk.updates.start();
  }

  private async processVideo(url: string, type: videoConverterType, context: MessageContext<ContextDefaultState>) {
    await context.send('Запрос получен');

    const videoData = await this.converterService
      .getVideoMetadata(type, url, context)
      .then((res) => res)
      .catch(async (err) => {
        this.logService.error(err);
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
