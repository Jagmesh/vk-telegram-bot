import * as internal from 'stream';

export type videoConverterType = 'youtube' | 'vkAttachment';

export interface IVideoMetadata {
  readableStream: internal.Readable;
  filePath: string;
  videoTitle: string;
}
