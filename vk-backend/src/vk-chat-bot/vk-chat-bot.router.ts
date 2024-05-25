import { Injectable } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { ConfigService } from '@nestjs/config';
import { VK_CHAT_BOT_RESPONSES } from './vk-chat-bot.response';

@Injectable()
export class VkChatBotRouter {
  constructor(
    private readonly vkChatBotService: VkChatBotService,
    private readonly vkService: VkService,
    private readonly logService: LogService,
    private readonly configService: ConfigService,
  ) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  async start(): Promise<void> {
    this.vkService.vk.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') return;
      if (!context.text && !context.attachments) return;

      if (context.text && context.text.startsWith('/')) {
        const [command, commandPayload] = context.text.split(/\s+(.*)/);
        return await this.handleTextCommands(command.replace(/[^a-zA-Z]/g, ''), commandPayload, context);
      }

      const links = context.getAttachments('link');
      if (links && links.length) {
        return await this.handleTextCommands('gif', links[0].url, context);
      }

      const videos = context.getAttachments('video');
      if (videos && videos.length) {
        const video = videos[0];
        return await this.vkChatBotService.processVideo(`${video.ownerId}_${video.id}_${video.accessKey}`, 'vkVideo', context);
      }

      // if (context.attachments) {
      //   return await this.processVideo(context.getAttachments('doc')[0].url, 'vkAttachment', context);
      // }
    });

    await this.vkService.vk.updates.start();
  }

  // public async handleTextMessage(text: string, context: MessageContext<ContextDefaultState>) {
  //     if (text.startsWith('/')) return await this.handleTextCommands(text.replace(/[^a-zA-Z]/g, ''), context);
  //
  //     const youtubeUrlRegexp = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
  //     if (!youtubeUrlRegexp.test(text)) return this.logService.error('Provided text doesnt match youtube url regexp');
  //
  //     //await context.send('Скачиваение видео с youtube временно недоступно');
  //     return await this.processVideo(text, 'youtube', context);
  // }

  private async handleTextCommands(command: string, commandPayload: string, context: MessageContext<ContextDefaultState>) {
    console.log(command, commandPayload);
    if (command === 'help') {
      return await context.send(VK_CHAT_BOT_RESPONSES.COMMANDS.help(this.configService.get('VIDEO_MAX_DURATION')));
    }
    if (command === 'gif') {
      const youtubeUrlRegexp = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
      if (youtubeUrlRegexp.test(commandPayload)) return await this.vkChatBotService.processVideo(commandPayload, 'youtube', context);
      this.logService.error('Provided text doesnt match youtube url regexp');

      return this.vkChatBotService.processVideo(commandPayload, 'commonUrl', context);
    }
    return await context.send('Нет такой команды! Попробуй /help');
  }
}
