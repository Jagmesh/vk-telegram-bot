import { Inject, Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg-7';
import { LogService } from '../log/log.service';
import { ConfigType } from '@nestjs/config';
import { IVideoMetadata } from './converter.type';
import mainGlobalConfig from '../common/config/main-global.config';

@Injectable()
export class ConverterService {
  constructor(
    private readonly logService: LogService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
  ) {
    this.logService.setScope('CONVERTER');
  }

  async mp4ToGif({ readableStream, filePath, videoTitle }: IVideoMetadata): Promise<{
    videoTitle: string;
    filePath: string;
  }> {
    if (this.mainConfig.NODE_ENV !== 'production') ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

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
