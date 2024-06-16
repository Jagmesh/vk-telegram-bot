import { IVkChatBotReply } from './vk-chat-bot.type';

export class VkChatResponse {
  private readonly _reply: IVkChatBotReply;
  private readonly _sessionData: any;
  constructor(reply: string | IVkChatBotReply, sessionData?: any) {
    this._reply = typeof reply === 'string' ? { text: reply } : reply;
    this._sessionData = sessionData;
  }

  get reply() {
    return this._reply;
  }
  get sessionData() {
    return this._sessionData;
  }
}
