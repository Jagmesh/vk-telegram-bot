import { Inject, Injectable } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkService } from '../vk.service';
import { LogService } from '../../log/log.service';
import mainGlobalConfig from '../../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { VK_CHAT_BOT_RESPONSES } from './vk-chat-bot.response';

@Injectable()
export class VkChatBotRouter {
  constructor(
    private readonly vkChatBotService: VkChatBotService,
    private readonly vkService: VkService,
    private readonly logService: LogService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
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

  private async handleTextCommands(command: string, commandPayload: string, context: MessageContext<ContextDefaultState>) {
    console.log(command, commandPayload);
    if (command === 'help') {
      return await context.send(VK_CHAT_BOT_RESPONSES.COMMANDS.help(this.mainConfig.VIDEO_MAX_DURATION));
    }
    if (command === 'gif') {
      const youtubeUrlRegexp = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
      if (youtubeUrlRegexp.test(commandPayload)) return await this.vkChatBotService.processVideo(commandPayload, 'youtube', context);
      this.logService.error('Provided text doesnt match youtube url regexp');

      const commonUrlRegexp = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9.-]+)*\/?$/;
      if (commonUrlRegexp.test(commandPayload)) return this.vkChatBotService.processVideo(commandPayload, 'commonUrl', context);
      this.logService.error('Provided text doesnt match common url regexp');

      return await context.send('Нужно указать валидный URL');
    }
    return await context.send('Нет такой команды! Попробуй /help');
  }
}
