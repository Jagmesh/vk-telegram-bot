import { Inject, Injectable } from '@nestjs/common';
import { VK } from 'vk-io';
import { IVkSendMessageOptions } from './vk.interfaces';
import { ConfigType } from '@nestjs/config';
import { LogService } from '../log/log.service';
import mainGlobalConfig from '../common/config/main-global.config';

@Injectable()
export class VkService {
  private readonly _vkMain: VK;
  private readonly _vkUser: VK;

  constructor(
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly logService: LogService,
  ) {
    this.logService.setScope('VK');

    this._vkMain = new VK({
      token: this.mainConfig.VK_MAIN_GROUP_API_TOKEN,
    });
    this._vkUser = new VK({
      token: this.mainConfig.VK_APP_API_TOKEN,
    });
  }

  public async checkIfDonById(user_id: number, group_id: number): Promise<boolean> {
    const donuts = await this._vkMain.api.groups.getMembers({
      group_id,
      filter: 'donut',
    });
    return donuts?.items.includes(user_id);
  }

  public async getUserFullName(user_id: number): Promise<string> {
    const res = await this._vkMain.api.users.get({
      user_ids: [user_id],
    });
    if (!res || !res.length) return null;
    const { first_name, last_name } = res[0];
    if (!first_name || !last_name) return null;

    return `${first_name} ${last_name}`;
  }

  public async sendMessage(message: string, receiverUserId: number | number[], options?: IVkSendMessageOptions): Promise<void> {
    const userIds = Array.isArray(receiverUserId) ? [...receiverUserId] : [receiverUserId];
    this.logService.write(`Отправляем сообщение. Получатели (${userIds.length}): ${userIds.join(', ')}`);

    for (const userIdElement of userIds) {
      await this._vkMain.api.messages.send({
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

  public get vkUser(): VK {
    return this._vkUser;
  }
}
