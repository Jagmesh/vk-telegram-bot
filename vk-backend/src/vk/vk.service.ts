import { Injectable } from '@nestjs/common';
import { VK } from 'vk-io';
import { IVkSendMessageOptions } from './vk.interfaces';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../log/log.service';

@Injectable()
export class VkService {
  private readonly _vkMain: VK;
  private readonly _vkNotify: VK;
  constructor(private readonly configService: ConfigService, private readonly logService: LogService) {
    this.logService.setScope('VK');

    this._vkMain = new VK({
      token: this.configService.get<string>('VK_MAIN_GROUP_API_TOKEN'),
    });
    this._vkNotify = new VK({
      token: this.configService.get<string>('VK_NOTIFICATION_GROUP_API_TOKEN'),
    });
  }

  public async checkIfDonById(user_id: number, group_id: string): Promise<boolean> {
    const donuts = await this._vkMain.api.groups.getMembers({
      group_id,
      filter: 'donut',
    });
    return donuts?.items.includes(user_id);
  }

  public async getUserFullName(user_id: number): Promise<string> {
    const { first_name, last_name } = (
      await this._vkMain.api.users.get({
        user_ids: [user_id],
      })
    )[0];

    return `${first_name} ${last_name}`;
  }

  public async sendMessage(message: string, receiverUserId: number | number[], options?: IVkSendMessageOptions): Promise<void> {
    const userIds = Array.isArray(receiverUserId) ? [...receiverUserId] : [receiverUserId];
    this.logService.write(`Отправляем сообщение. Получатели (${userIds.length}): ${userIds.join(', ')}`);

    for (const userIdElement of userIds) {
      await this._vkNotify.api.messages.send({
        message,
        user_id: userIdElement,
        attachment: options?.attachment ?? undefined,
        random_id: Math.round(Math.random() * 1000),
      });
    }
  }

  public get vk(): VK {
    return this._vkMain;
  }
}
