import { Inject, Injectable } from '@nestjs/common';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { IVideoMetadata } from '../converter/converter.type';
import { VkService } from '../vk/vk.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigType } from '@nestjs/config';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';
import internal, * as stream from 'stream';
import { Readable } from 'stream';
import mainGlobalConfig from '../common/config/main-global.config';
import { IYtDlpJsonDump, videoConverterType } from './yt-dlp.interface';
import { randomInt } from '../common/utils/random-int';
import { spawn } from 'child_process';
import axios, { AxiosResponse } from 'axios';
import { WebScraperService } from '../web-scraper/web-scraper.service';

@Injectable()
export class YtDlpService {
  private readonly ytDlpPath: string;

  constructor(
    private readonly vk: VkService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly logService: LogService,
    private readonly scraperService: WebScraperService,
  ) {
    this.logService.setScope('YT_DLP');
    this.ytDlpPath = this.mainConfig.NODE_ENV === 'production' ? '/usr/bin/yt-dlp' : 'C:/yt-dlp/yt-dlp.exe';
  }

  async getVideoInfo(type: videoConverterType, url: string, context: MessageContext<ContextDefaultState>): Promise<IVideoMetadata> {
    if (type === 'youtube') return await this.getYoutubeVideo(url);

    if (type === 'vkAttachment') {
      const videoTitle = context.getAttachments('doc')[0].title;
      const filePath = `downloaded/${videoTitle}.gif`;
      console.log(videoTitle);

      const videoUrl = await this.scraperService.scrapeForHrefLinks(url, '.FlatButton');
      if (!videoUrl) throw new ConverterError(`Не удалось скачать файл`);

      const readableStream = await this.createYtDLStream(videoUrl[0])
        .then((res) => res)
        .catch((err) => {
          throw err;
        });

      return { readableStream, videoTitle, filePath };
    }

    if (type === 'vkVideo') return await this.getVkVideo(url);

    if (type === 'commonUrl') {
      const videoTitle = `${Math.round(Math.random() * 1_000_000)}`;
      const filePath = `downloaded/${videoTitle}.gif`;

      const response: AxiosResponse<stream.Readable> = await axios.get(url, { responseType: 'stream' });
      const readableStream = response.data;

      return { readableStream, videoTitle, filePath };
    }
  }

  async getVkVideo(url: string): Promise<IVideoMetadata> {
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

    const videoTitle = Translit.ruToEng(video.title);
    this.logService.write(`Original title: ${video.title}. Changed title: ${videoTitle}`);
    const filePath = `downloaded/${videoTitle}.gif`;

    let videoLink: string = video.player;
    if (video?.files?.hls && (video?.files?.hls as string).includes('.mycdn.me')) videoLink = video.files.hls;

    const readableStream = await this.createYtDLStream(videoLink)
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
