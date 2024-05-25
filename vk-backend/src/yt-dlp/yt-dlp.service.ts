import { Injectable } from '@nestjs/common';
import { ContextDefaultState, MessageContext } from 'vk-io';
import { IVideoMetadata } from '../converter/converter.types';
import { VkService } from '../vk/vk.service';
import { ConverterError } from '../converter/converter.error';
import { ConfigService } from '@nestjs/config';
import { Translit } from '../common/utils/transliterator';
import { LogService } from '../log/log.service';
import internal from 'stream';

const { spawn } = require('child_process');
const { Readable } = require('stream');

@Injectable()
export class YtDlpService {
  private readonly ytDlpPath: string;

  constructor(private readonly vk: VkService, private readonly configService: ConfigService, private readonly logService: LogService) {
    this.logService.setScope('YT_DLP');
    this.ytDlpPath = this.configService.get('NODE_ENV') === 'production' ? '/usr/bin/yt-dlp' : 'C:/yt-dlp/yt-dlp.exe';
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

    let readableStream = await this.createYtDLStream(video.player)
      .then((res) => res)
      .catch((err) => err);
    if (!readableStream) {
      readableStream = await this.createYtDLStream(video.files.src)
        .then((res) => res)
        .catch((err) => err);
    }

    return {
      readableStream,
      videoTitle,
      filePath,
    };
  }

  async getYoutubeVideo(url: string) {
    // this.logService.write(`YOUTUBE_REQUEST_COOKIES: ${this.configService.get('YOUTUBE_REQUEST_COOKIES').slice(0, 100)}`);
    // this.logService.write(`YOUTUBE_ID_TOKEN: ${this.configService.get('YOUTUBE_ID_TOKEN')}`);
    // const videoInfo = await ytdl
    //   .getBasicInfo(url, {
    //     requestOptions: {
    //       headers: {
    //         cookie: this.configService.get<string>('YOUTUBE_REQUEST_COOKIES'),
    //         'x-youtube-identity-token': this.configService.get<string>('YOUTUBE_ID_TOKEN'),
    //       },
    //     },
    //   })
    //   .then((res) => res)
    //   .catch((err) => this.logService.error(err));
    // if (!videoInfo) return;
    //
    // if (!videoInfo?.videoDetails?.title) throw new ConverterError('Нет названия видео');
    // const videoMaxLength = Number(this.configService.get('VIDEO_MAX_DURATION'));
    // if (Number(videoInfo.videoDetails.lengthSeconds) > videoMaxLength) {
    //   throw new ConverterError(`Видео не должно быть больше ${videoMaxLength} секунд по длительности`);
    // }
    // const videoTitle = Translit.ruToEng(videoInfo.videoDetails.title);
    // this.logService.write(`Original title: ${videoInfo?.videoDetails?.title}. Changed title: ${videoTitle}`);

    await this.getVideoMetadata(url);

    const videoTitle = `test_gif_${Math.round(Math.random() * 1000000)}`;
    const filePath = `downloaded/${videoTitle}.gif`;

    const readableStream = await this.createYtDLStream(url)
      .then((res) => res)
      .catch((err) => err);
    console.log(readableStream);

    return { readableStream, filePath, videoTitle };
  }

  private createYtDLStream(url): Promise<internal.Readable> {
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
        if (code !== 0) {
          this.logService.error(`yt-dlp process exited with code ${code}`);
          reject();
        }

        readableStream.push(null);
        resolve(readableStream);
      });
    });
  }

  private getVideoMetadata(url): Promise<internal.Readable> {
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
        if (code !== 0) {
          this.logService.error(`yt-dlp process exited with code ${code}`);
          reject();
        }

        try {
          resolve(JSON.parse(jsonOutput).duration);
        } catch (err) {
          console.error('Error parsing JSON output', err);
        }
      });
    });
  }
}
