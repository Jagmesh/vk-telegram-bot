import { Inject, Injectable } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkService } from '../vk.service';
import { LogService } from '../../log/log.service';
import mainGlobalConfig from '../../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';
import { ContextDefaultState, Keyboard, MessageContext } from 'vk-io';
import { VK_CHAT_BOT_RESPONSES } from './vk-chat-bot.response';
import { getVideoUrlFromPlainText } from './vk-chat-bot.util';
import { CONVERTER_OPTIMIZATION_TYPES } from '../../converter/converter.constant';
import { VkSessionService } from './vk-session/vk-session.service';
import { videoConverterType } from '../../yt-dlp/yt-dlp.interface';
import { ConverterError } from '../../converter/converter.error';
import { VkChatResponse } from './vk-chat-bot.vk-response';

@Injectable()
export class VkChatBotRouter {
  constructor(
    private readonly vkChatBotService: VkChatBotService,
    private readonly vkService: VkService,
    private readonly logService: LogService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly vkSession: VkSessionService,
  ) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  async start(): Promise<void> {
    this.vkService.vk.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') return;
      if (!context.text && !context.attachments) return;

      let replyData: VkChatResponse;
      if (context.text && context.text.startsWith('/')) {
        const [command, commandPayload] = context.text.split(/\s+(.*)/);
        replyData = await this.handleTextCommands(command.replace(/[^a-zA-Z]/g, ''), commandPayload, context);
      }

      const links = context.getAttachments('link');
      if (links && links.length) {
        replyData = await this.handleTextCommands('gif', links[0].url, context);
      }

      const videos = context.getAttachments('video');
      if (videos && videos.length) {
        const video = videos[0];
        replyData = await this.processVideo(`${video.ownerId}_${video.id}_${video.accessKey}`, 'vkVideo', context);
      }

      // if (context.attachments) {
      //   replyData = await this.processVideo(context.getAttachments('doc')[0].url, 'vkAttachment', context);
      // }

      if (replyData) await context.send(replyData.reply.text, replyData.reply.params || undefined);
    });

    await this.vkService.vk.updates.start();
  }

  private async handleTextCommands(
    command: string,
    commandPayload: string,
    context: MessageContext<ContextDefaultState>,
  ): Promise<VkChatResponse> {
    if (command === 'help') {
      return new VkChatResponse(VK_CHAT_BOT_RESPONSES.COMMANDS.help(this.mainConfig.VIDEO_MAX_DURATION));
    }
    if (command === 'gif') {
      const youtubeUrlRegexp = /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
      if (youtubeUrlRegexp.test(commandPayload)) return await this.processVideo(commandPayload, 'youtube', context);
      this.logService.error('Provided text doesnt match youtube url regexp');

      const vkVideoUrlRegexp = /(https?:\/\/)?(www\.)?vk\.com\/(video|clip)(-?\d+)_\d+(\?\S*)?/;
      if (vkVideoUrlRegexp.test(commandPayload)) {
        const vkVideoUrl = getVideoUrlFromPlainText(commandPayload);
        if (vkVideoUrl) return await this.processVideo(vkVideoUrl, 'vkVideo', context);
        this.logService.error(`No video url found`);
      }
      this.logService.error('Provided text doesnt match vk url regexp');

      const commonUrlRegexp = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9.-]+)*\/?$/;
      if (commonUrlRegexp.test(commandPayload)) return this.processVideo(commandPayload, 'commonUrl', context);
      this.logService.error('Provided text doesnt match common url regexp');

      return new VkChatResponse('Нужно указать валидный URL');
    }
    // TODO create optimization choosing via buttons
    // if (command === 'buttons') {
    //     return new VkChatResponse({
    //         text: 'Выбери уровень сжатия гифки',
    //         params: {
    //             keyboard: Keyboard.builder()
    //                 .textButton({
    //                     label: 'Сильный',
    //                     payload: {
    //                         optimizationType: CONVERTER_OPTIMIZATION_TYPES.HARD
    //                     },
    //                 }).row()
    //                 .textButton({
    //                     label: 'Слабый',
    //                     payload: {
    //                         optimizationType: CONVERTER_OPTIMIZATION_TYPES.SOFT
    //                     },
    //                 })
    //                 .inline()
    //         }
    //     })
    // }
    return new VkChatResponse('Нет такой команды! Попробуй /help');
  }

  public async processVideo(url: string, type: videoConverterType, context: MessageContext<ContextDefaultState>): Promise<VkChatResponse> {
    await context.send('🤓 Запрос получен. Пожалуйста, подожди. Обработка видео может занять до 3 минут');

    return this.vkChatBotService
      .processVideo(url, type, context)
      .then((res) => res)
      .catch((err) => {
        if (err instanceof ConverterError) return new VkChatResponse(`⚠️ Ошибка!\n\n${err.message}`);
        if (type === 'youtube') return new VkChatResponse('Youtube на меня обиделся, и больше не дает скачивать видосы ¯\\_(ツ)_/¯');
        return new VkChatResponse('⚠️ При обработке видео возникла ошибка');
      });
  }
}
