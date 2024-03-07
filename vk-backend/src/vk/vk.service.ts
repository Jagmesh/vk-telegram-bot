import { Injectable } from '@nestjs/common';
import { VK } from 'vk-io';
import { IVkSendMessageOptions } from './vk.interfaces';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../log/log.service';
import { CROCODILES_BOOM_GIF_LIST } from './vk.consts';

@Injectable()
export class VkService {
  private readonly vkMain: VK;
  private readonly vkNotify: VK;
  constructor(private readonly configService: ConfigService, private readonly logService: LogService) {
    this.logService.setScope('VK');

    this.vkMain = new VK({
      token: this.configService.get<string>('VK_MAIN_GROUP_API_TOKEN'),
    });
    this.vkNotify = new VK({
      token: this.configService.get<string>('VK_NOTIFICATION_GROUP_API_TOKEN'),
    });
  }

  async checkIfDonById(user_id: number, group_id: string): Promise<boolean> {
    const donuts = await this.vkMain.api.groups.getMembers({
      group_id,
      filter: 'donut',
    });
    return donuts?.items.includes(user_id);
  }

  async getUserFullName(user_id: number): Promise<string> {
    const { first_name, last_name } = (
      await this.vkMain.api.users.get({
        user_ids: [user_id],
      })
    )[0];

    return `${first_name} ${last_name}`;
  }

  async sendMessage(message: string, receiverUserId: number | number[], options?: IVkSendMessageOptions): Promise<void> {
    const userIds = Array.isArray(receiverUserId) ? [...receiverUserId] : [receiverUserId];
    this.logService.write(`Отправляем сообщение. Получатели (${userIds.length}): ${userIds.join(', ')}`);

    for (const userIdElement of userIds) {
      await this.vkNotify.api.messages.send({
        message,
        user_id: userIdElement,
        attachment: options?.attachment ?? undefined,
        random_id: Math.round(Math.random() * 1000),
      });
    }
  }

  async listenToIncomingMessages(): Promise<void> {
    this.vkMain.updates.on('message_new', async (context) => {
      if (context.peerType === 'chat') {
        return this.logService.write('Получили peerType === chat. Игнорируем');
      }

      await context.sendDocuments({
        value: CROCODILES_BOOM_GIF_LIST[Math.floor(Math.random() * CROCODILES_BOOM_GIF_LIST.length)],
      });
    });

    await this.vkMain.updates.start();
  }
}
