import { Injectable } from '@nestjs/common';
import * as ytdl from 'ytdl-core';
import { ConverterError } from '../converter/converter.error';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YtdlService {
  constructor(private readonly logService: LogService, private readonly configService: ConfigService) {
    this.logService.setScope('YTDL');
  }

  async getVideoData(url: string) {
    const videoInfo = await ytdl.getBasicInfo(url);

    if (!videoInfo?.videoDetails?.title) throw new ConverterError('Нет названия видео');
    const videoMaxLength = Number(this.configService.get('YOUTUBE_MAX_LENGTH'));
    if (Number(videoInfo.videoDetails.lengthSeconds) > videoMaxLength) {
      throw new ConverterError(`Видео не должно быть больше ${videoMaxLength} секунд по длительности`);
    }
    const videoTitle = Translit.ruToEng(videoInfo.videoDetails.title);
    this.logService.write(`Original title: ${videoInfo?.videoDetails?.title}. Changed title: ${videoTitle}`);

    const filePath = `downloaded/${videoTitle}.gif`;

    return { readableStream: ytdl(url), filePath, videoTitle };
  }
}
