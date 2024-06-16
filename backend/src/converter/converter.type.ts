import * as internal from 'stream';

export interface IVideoMetadata {
  readableStream: internal.Readable;
  filePath: string;
  videoTitle: string;
}
