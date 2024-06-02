import { Inject, Injectable } from '@nestjs/common';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { IVideoMetadata } from '../converter/converter.types';
import { VkService } from '../vk/vk.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigType } from '@nestjs/config';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';
import internal from 'stream';
import mainGlobalConfig from '../common/config/main-global.config';
import { IYtDlpJsonDump } from './yt-dlp.interface';
import { randomInt } from '../common/utils/random-int';
import { spawn } from 'child_process';
import { Readable } from 'stream';

@Injectable()
export class YtDlpService {
  private readonly ytDlpPath: string;

  constructor(
    private readonly vk: VkService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly logService: LogService,
  ) {
    this.logService.setScope('YT_DLP');
    this.ytDlpPath = this.mainConfig.NODE_ENV === 'production' ? '/usr/bin/yt-dlp' : 'C:/yt-dlp/yt-dlp.exe';
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
    if (video.duration > this.mainConfig.VIDEO_MAX_DURATION) {
      throw new ConverterError(`Видео не должно быть больше ${this.mainConfig.VIDEO_MAX_DURATION} секунд по длительности`);
    }

    const readableStream = await this.createYtDLStream(video.player)
      .then((res) => res)
      .catch((err) => err);

    return {
      readableStream,
      videoTitle,
      filePath,
    };
  }

  async getYoutubeVideo(url: string) {
    const videoInfo = await this.getVideoMetadata(url)
      .then((res) => res)
      .catch((err) => this.logService.error(err));
    if (!videoInfo) return;

    if (videoInfo.duration > this.mainConfig.VIDEO_MAX_DURATION) {
      throw new ConverterError(`Видео не должно быть больше ${this.mainConfig.VIDEO_MAX_DURATION} секунд по длительности`);
    }

    const videoTitle = Translit.ruToEng(videoInfo?.title || `${randomInt(10_000, 1_000_000)}`);
    const filePath = `downloaded/${videoTitle}.gif`;

    const readableStream = await this.createYtDLStream(url)
      .then((res) => res)
      .catch((err) => err);
    console.log(readableStream);

    return { readableStream, filePath, videoTitle };
  }

  private createYtDLStream(url: string): Promise<internal.Readable> {
    return new Promise((resolve, reject) => {
      const ytDLProcess = spawn(this.ytDlpPath, [url, '-o', '-']);

      const readableStream = new Readable({
        read(size) {},
      });

      ytDLProcess.stdout.on('data', (data) => {
        readableStream.push(data);
      });

      // For some reason we have an info data in stderr stream
      ytDLProcess.stderr.on('data', (data) => {
        if (data && data.length) this.logService.write(data);
      });

      ytDLProcess.on('close', (code) => {
        if (code !== 0) return reject(this.logService.error(`yt-dlp process exited with code ${code}`));

        readableStream.push(null);
        resolve(readableStream);
      });
    });
  }

  private getVideoMetadata(url: string): Promise<IYtDlpJsonDump> {
    return new Promise((resolve, reject) => {
      const ytDLProcess = spawn(this.ytDlpPath, ['--dump-json', url]);

      let jsonOutput = '';
      ytDLProcess.stdout.on('data', (data) => {
        jsonOutput += data.toString();
      });

      // For some reason we have an info data in stderr stream
      ytDLProcess.stderr.on('data', (data) => {
        if (data && data.length) this.logService.error(data);
      });

      ytDLProcess.on('close', (code) => {
        if (code !== 0) return reject(this.logService.error(`yt-dlp process exited with code ${code}`));
        resolve(JSON.parse(jsonOutput));
      });
    });
  }
}
