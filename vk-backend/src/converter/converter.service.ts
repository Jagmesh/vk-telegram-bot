import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg-7';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';
import { IVideoMetadata, videoConverterType } from './converter.types';
import { ContextDefaultState, MessageContext } from 'vk-io';
import axios from 'axios';
import { YtDlpService } from '../yt-dlp/yt-dlp.service';

@Injectable()
export class ConverterService {
  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    // private readonly ytdlService: YoutubeDownloadService,
    private readonly ytDlpService: YtDlpService,
  ) {
    this.logService.setScope('CONVERTER');
  }

  async getVideoMetadata(type: videoConverterType, url: string, context: MessageContext<ContextDefaultState>): Promise<IVideoMetadata> {
    if (type === 'youtube') return await this.ytDlpService.getYoutubeVideo(url);

    if (type === 'vkAttachment') {
      const videoTitle = context.getAttachments('doc')[0].title;
      const filePath = `downloaded/${videoTitle}.gif`;

      const response = await axios.get(url, { responseType: 'stream' });
      const readableStream = response.data;

      return { readableStream, videoTitle, filePath };
    }

    if (type === 'vkVideo') return await this.ytDlpService.getVkVideo(url, context);

    if (type === 'commonUrl') {
      const videoTitle = `mega_test_${Math.round(Math.random() * 10000)}`;
      const filePath = `downloaded/${videoTitle}.gif`;

      const response = await axios.get(url, { responseType: 'stream' });
      const readableStream = response.data;

      return { readableStream, videoTitle, filePath };
    }
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
