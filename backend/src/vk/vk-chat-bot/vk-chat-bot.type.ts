import { IMessageContextSendOptions } from 'vk-io';

export interface IVkChatBotReply {
  text: string;
  params?: IMessageContextSendOptions;
}

export interface IVkChatBotResponseFullData {
  reply: IVkChatBotReply;
  sessionData?: any;
}
