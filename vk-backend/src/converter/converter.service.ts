import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg-7';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';
import { YoutubeDownloadService } from '../youtube-download/youtube-download.service';
import { IVideoMetadata, videoConverterType } from './converter.types';
import { ContextDefaultState, MessageContext, VK } from 'vk-io';
import axios from 'axios';
import * as fs from 'fs';
import { YtDlpService } from '../yt-dlp/yt-dlp.service';
const { PassThrough } = require('stream');
// import {} from '@types/fluent-ffmpeg'
const YTDlpWrap = require('yt-dlp-wrap').default;

@Injectable()
export class ConverterService {
  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    private readonly ytdlService: YoutubeDownloadService,
    private readonly ytDlpService: YtDlpService,
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

      return { readableStream, videoTitle, filePath };
    }

    if (type === 'vkVideo') return await this.ytDlpService.getVkVideo(url, context);
  }

  async mp4ToGif({ readableStream, filePath, videoTitle }: IVideoMetadata): Promise<{
    videoTitle: string;
    filePath: string;
  }> {
    if (this.configService.get('NODE_ENV') !== 'production') ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

    return new Promise((resolve, reject) => {
      ffmpeg(readableStream)
        .complexFilter('fps=20,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=32[p];[s1][p]paletteuse=dither=bayer')
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
