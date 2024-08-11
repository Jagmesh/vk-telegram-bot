import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { BASE_TELEGRAM_POST_URL, MESSAGE_ID_PREFIX } from './telegraf-bot.consts';
import { findCustomEmoji } from './telegraf-bot.helper';
import { LogService } from '../../log/log.service';
import mainGlobalConfig from '../../common/config/main-global.config';
import { TelegramService } from '../telegram.service';
import { CacheStorageService } from '../../cache-storage/cache-storage.service';
import { VkService } from '../../vk/vk.service';
import { ReactionTypeCustomEmoji } from '@telegraf/types/manage';

@Injectable()
export class TelegrafBotService {
  constructor(
    private readonly logService: LogService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
    private readonly telegramService: TelegramService,
    private readonly cache: CacheStorageService,
    private readonly vk: VkService,
  ) {
    this.logService.setScope('TELEGRAF_BOT');

    this.telegramService.create(
      this.mainConfig.TELEGRAM_BOT_API_TOKEN,
      this.mainConfig.TELEGRAM_CHAT_ID,
      this.mainConfig.TELEGRAM_ADMIN_USER_ID,
    );
  }

  hookOnChannelReactions(): void {
    this.telegramService.telegraf.on('message_reaction_count', async (ctx) => {
      const messageId = ctx?.messageReactionCount?.message_id;

      if (!ctx.messageReactionCount || !ctx.messageReactionCount.reactions) return;

      const customReactions = ctx.messageReactionCount.reactions.filter((el) => {
        return findCustomEmoji((el?.type as ReactionTypeCustomEmoji).custom_emoji_id);
      });
      if (!customReactions || !customReactions.length) return;
      this.logService.write(
        `Custom reactions on post (${messageId}): ${JSON.stringify(
          customReactions.map((reaction) => {
            return {
              name: findCustomEmoji((reaction?.type as ReactionTypeCustomEmoji).custom_emoji_id),
              count: reaction.total_count,
            };
          }),
          null,
          2,
        )}`,
      );
      const customReactionsTotalCount = customReactions.map((el) => el.total_count).reduce((acc, curr) => acc + curr, 0);
      this.logService.write(`Total number of crocodiles reactions on post (${messageId}): ${customReactionsTotalCount}`);

      const reactionsGoal = this.mainConfig.TELEGRAM_POST_REACTIONS_GOAL;
      if (customReactionsTotalCount < reactionsGoal) return;
      this.logService.write(`Post with ${messageId} id reached a reactions number goal!`);

      const postData = await this.cache.get<ITgToVkCachedData>(`${MESSAGE_ID_PREFIX}_${ctx.messageReactionCount.message_id}`);
      this.logService.write(`postData: ${JSON.stringify(postData)}`);
      if (!postData) return;
      await this.cache.del(`${MESSAGE_ID_PREFIX}_${ctx.messageReactionCount.message_id}`);

      await this.telegramService.sendAlert(
        `Пост с id ${ctx.messageReactionCount.message_id} набрал нужное кол-во крокодилов в ${reactionsGoal} штук!` +
          `\n\nТекст: "${postData.text}"` +
          `\n\nСсылка на пост: ${BASE_TELEGRAM_POST_URL}${ctx.messageReactionCount.message_id}`,
      );

      await this.vk.vkUser.api.wall.post({
        post_id: postData.vkPostId,
        owner_id: -`${this.mainConfig.VK_GROUP_ID}`
      });
    });

    this.telegramService.telegraf.launch({
      allowedUpdates: ['message_reaction_count', 'message', 'channel_post'],
    });
  }
}
