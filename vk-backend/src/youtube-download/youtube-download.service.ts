import { Injectable } from '@nestjs/common';
import * as ytdl from 'ytdl-core';
import { ConverterError } from '../converter/converter.error';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YoutubeDownloadService {
  constructor(private readonly logService: LogService, private readonly configService: ConfigService) {
    this.logService.setScope('YOUTUBE_DOWNLOAD');
  }

  async getVideoData(url: string) {
    this.logService.write(`YOUTUBE_REQUEST_COOKIES: ${this.configService.get('YOUTUBE_REQUEST_COOKIES').slice(0, 100)}`);
    this.logService.write(`YOUTUBE_ID_TOKEN: ${this.configService.get('YOUTUBE_ID_TOKEN')}`);
    const videoInfo = await ytdl
      .getBasicInfo(url, {
        requestOptions: {
          headers: {
            cookie: this.configService.get<string>('YOUTUBE_REQUEST_COOKIES'),
            'x-youtube-identity-token': this.configService.get<string>('YOUTUBE_ID_TOKEN'),
          },
        },
      })
      .then((res) => res)
      .catch((err) => this.logService.error(err));
    if (!videoInfo) return;

    if (!videoInfo?.videoDetails?.title) throw new ConverterError('Нет названия видео');
    const videoMaxLength = Number(this.configService.get('VIDEO_MAX_DURATION'));
    if (Number(videoInfo.videoDetails.lengthSeconds) > videoMaxLength) {
      throw new ConverterError(`Видео не должно быть больше ${videoMaxLength} секунд по длительности`);
    }
    const videoTitle = Translit.ruToEng(videoInfo.videoDetails.title);
    this.logService.write(`Original title: ${videoInfo?.videoDetails?.title}. Changed title: ${videoTitle}`);

    const filePath = `downloaded/${videoTitle}.gif`;

    return { readableStream: ytdl(url), filePath, videoTitle };
  }
}
