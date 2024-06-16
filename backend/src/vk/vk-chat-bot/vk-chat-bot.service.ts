import { Inject, Injectable } from '@nestjs/common';
import { VkService } from '../vk.service';
import { LogService } from '../../log/log.service';
import { ConverterService } from '../../converter/converter.service';
import mainGlobalConfig from '../../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';
import { ContextDefaultState, MessageContext } from 'vk-io';
import * as fs from 'fs';
import { YtDlpService } from '../../yt-dlp/yt-dlp.service';
import { videoConverterType } from '../../yt-dlp/yt-dlp.interface';
import { VkChatResponse } from './vk-chat-bot.vk-response';

@Injectable()
export class VkChatBotService {
  constructor(
    private readonly vkService: VkService,
    private readonly logService: LogService,
    private readonly converterService: ConverterService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly ytdlpservice: YtDlpService,
  ) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  public async processVideo(url: string, type: videoConverterType, context: MessageContext<ContextDefaultState>): Promise<VkChatResponse> {
    const videoData = await this.ytdlpservice
      .getVideoInfo(type, url, context)
      .then((res) => res)
      .catch((err) => {
        this.logService.error(`Error occurred while geting video metadata: ${err}`);
        throw err;
      });

    const conversionResult = await this.converterService
      .mp4ToGif(videoData)
      .then((res) => res)
      .catch((err) => {
        this.logService.error(`Error occurred while converting videoStream to gif: ${err}`);
        throw err;
      });
    const { videoTitle, filePath } = conversionResult;

    this.logService.write('File is ready. Sending');
    const attachment = await this.vkService.vk.upload.wallDocument({
      group_id: this.mainConfig.VK_GROUP_ID,
      source: {
        value: filePath,
        filename: `SGINKN_${videoTitle}.gif`,
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
    return new VkChatResponse('🐊 Ржыте наз доровье!');
  }
}
