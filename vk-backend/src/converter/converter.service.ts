import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';
import { YtdlService } from '../ytdl/ytdl.service';
import { IVideoMetadata, videoConverterType } from './converter.types';
import { ContextDefaultState, MessageContext } from 'vk-io';
import axios from 'axios';

@Injectable()
export class ConverterService {
  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    private readonly ytdlService: YtdlService,
  ) {
    this.logService.setScope('CONVERTER');
  }

  async getVideoMetadata(type: videoConverterType, url: string, context: MessageContext<ContextDefaultState>): Promise<IVideoMetadata> {
    if (type === 'youtube') return this.ytdlService.getVideoData(url);

    if (type === 'vkAttachment') {
      const videoTitle = context.getAttachments('doc')[0].title;
      const filePath = `downloaded/${videoTitle}.gif`;

      const response = await axios.get(url, { responseType: 'stream' });
      const readableStream = response.data;

      return {
        readableStream: readableStream,
        videoTitle,
        filePath,
      };
    }
  }

  async mp4ToGif({ readableStream, filePath, videoTitle }: IVideoMetadata): Promise<{
    videoTitle: string;
    filePath: string;
  }> {
    if (this.configService.get('NODE_ENV') !== 'production') ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

    return new Promise((resolve, reject) => {
      ffmpeg(readableStream)
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
