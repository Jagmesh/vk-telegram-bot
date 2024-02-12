import { Injectable } from '@nestjs/common';
import { VK } from 'vk-io';
import { DonutIsDonParams } from 'vk-io/lib/api/schemas/params';
import { IVkSendMessageOptions } from './vk.interface';

@Injectable()
export class VkService {
  private readonly vkMain: VK;
  private readonly vkNotify: VK;
  constructor() {
    this.vkMain = new VK({
      token: process.env.VK_MAIN_GROUP_API_TOKEN,
    });
    this.vkNotify = new VK({
      token: process.env.VK_NOTIFICATION_GROUP_API_TOKEN,
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

  async sendMessage(message: string, user_id: number, options?: IVkSendMessageOptions): Promise<void> {
    await this.vkNotify.api.messages.send({
      message,
      user_id,
      attachment: options?.attachment ?? undefined,
      random_id: Math.round(Math.random() * 1000),
    });
  }
}
