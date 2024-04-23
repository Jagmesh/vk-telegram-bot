import { Injectable } from '@nestjs/common';
import * as ytdl from 'ytdl-core';
import { Translit } from '../common/utils/transliterator';
import * as ffmpeg from 'fluent-ffmpeg';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';
import { ConverterError } from './converter.error';
import * as process from 'process';

@Injectable()
export class ConverterService {
  constructor(private readonly logService: LogService, private readonly configService: ConfigService) {
    this.logService.setScope('CONVERTER');
  }
  async mp4ToGif(url: string): Promise<{ videoTitle: string; filePath: string }> {
    const videoInfo = await ytdl.getBasicInfo(url);

    if (!videoInfo?.videoDetails?.title) throw new ConverterError('Нет названия видео');
    const videoMaxLength = Number(this.configService.get('YOUTUBE_MAX_LENGTH'));
    if (Number(videoInfo.videoDetails.lengthSeconds) > videoMaxLength) {
      throw new ConverterError(`Видео не должно быть больше ${videoMaxLength} секунд по длительности`);
    }
    const videoTitle = Translit.ruToEng(videoInfo.videoDetails.title);
    this.logService.write(`Original title: ${videoInfo?.videoDetails?.title}. Changed title: ${videoTitle}`);

    if (this.configService.get('NODE_ENV') !== 'production') ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

    const filePath = `downloaded/${videoTitle}.gif`;

    return new Promise((resolve, reject) => {
      ffmpeg(ytdl(url))
        .output(filePath)
        .on('error', (err) => {
          this.logService.error('Failed file processing');
          reject(err);
        })
        .on('end', async () => {
          this.logService.write('Finished file processing');
          resolve({ videoTitle, filePath });
        })
        .run();
    });
  }
}
