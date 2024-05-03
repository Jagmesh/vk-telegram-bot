import { Injectable } from '@nestjs/common';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { default as YTDlpWrap } from 'yt-dlp-wrap';
import { IVideoMetadata } from '../converter/converter.types';
import { VkService } from '../vk/vk.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigService } from '@nestjs/config';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';

@Injectable()
export class YtDlpService {
  private readonly _ytDlp: YTDlpWrap;

  constructor(private readonly vk: VkService, private readonly configService: ConfigService, private readonly logService: LogService) {
    this.logService.setScope('YT_DLP');
    this.configService.get('NODE_ENV') === 'production'
      ? (this._ytDlp = new YTDlpWrap('/usr/bin/yt-dlp'))
      : (this._ytDlp = new YTDlpWrap('C:/yt-dlp/yt-dlp.exe'));
  }

  async getVkVideo(url: string, context: MessageContext<ContextDefaultState>): Promise<IVideoMetadata> {
    const videoTitle = Translit.ruToEng(context.getAttachments('video')[0].title);
    this.logService.write(`Original title: ${context.getAttachments('video')[0].title}. Changed title: ${videoTitle}`);
    const filePath = `downloaded/${videoTitle}.gif`;

    const videos = await this.vk.vkUser.api.video.get({
      videos: url,
    });
    if (!videos || !videos.items || !videos.items.length) throw new ConverterError(`Не удалось найти такое видео`);
    const video = videos.items[0];
    this.logService.write(`Received video: ${JSON.stringify(video, null, 2)}`);
    if (video.duration === 0 || video.is_private === 1)
      throw new ConverterError('Видео недоступно по настройкам приватности. Попробуй изменить настройки в видео, сделав его публичным');
    const videoMaxLength = Number(this.configService.get('VIDEO_MAX_DURATION'));
    if (video.duration > videoMaxLength) {
      throw new ConverterError(`Видео не должно быть больше ${videoMaxLength} секунд по длительности`);
    }

    const readableStream = this._ytDlp.execStream([video.player, '-f', 'best[ext=mp4]']);

    return {
      readableStream,
      videoTitle,
      filePath,
    };
  }
}
