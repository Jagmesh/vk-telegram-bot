import { Injectable } from '@nestjs/common';
import { CROCODILES_BOOM_GIF_LIST } from '../vk/vk.consts';
import { VkService } from '../vk/vk.service';
import { LogService } from '../log/log.service';

@Injectable()
export class VkChatBotService {
  constructor(private readonly vkService: VkService, private readonly logService: LogService) {
    this.logService.setScope('VK_CHAT_BOT');
  }

  async start(): Promise<void> {
    this.vkService.vk.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') return;

      await context.sendDocuments({
        value: CROCODILES_BOOM_GIF_LIST[Math.floor(Math.random() * CROCODILES_BOOM_GIF_LIST.length)],
      });
    });

    await this.vkService.vk.updates.start();
  }
}
