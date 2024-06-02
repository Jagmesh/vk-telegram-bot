import * as internal from 'stream';

export type videoConverterType = 'youtube' | 'vkVideo' | 'vkAttachment' | 'commonUrl';

export interface IVideoMetadata {
  readableStream: internal.Readable;
  filePath: string;
  videoTitle: string;
}
