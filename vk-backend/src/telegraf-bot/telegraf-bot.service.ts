import { Injectable } from '@nestjs/common';
import { LogService } from '../log/log.service';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { BASE_TELEGRAM_POST_URL, MESSAGE_ID_PREFIX, VALID_CUSTOM_EMOJI_ENUM } from './telegraf-bot.consts';
import { CacheStorageService } from '../cache-storage/cache-storage.service';

@Injectable()
export class TelegrafBotService {
  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly cache: CacheStorageService,
  ) {
    this.logService.setScope('TELEGRAF_BOT');

    this.telegramService.create(
      this.configService.get<string>('TELEGRAM_BOT_API_TOKEN'),
      this.configService.get<string>('TELEGRAM_CHAT_ID'),
      this.configService.get<string>('TELEGRAM_ADMIN_USER_ID'),
    );
  }

  hookOnChannelReactions(): void {
    this.telegramService.telegraf.on('channel_post', async (ctx) => {
      const messageId = ctx?.update?.channel_post?.message_id;
      // @ts-ignore // in reality text and caption fields exist
      const postText: string = ctx?.update?.channel_post?.text || ctx?.update?.channel_post?.caption;
      if (!messageId || !postText) return;

      this.logService.write(`Received a new post with id ${messageId} and text: ${postText}`);

      await this.cache.set(`${MESSAGE_ID_PREFIX}_${messageId}`, { text: postText });
    });

    this.telegramService.telegraf.on('message_reaction_count', async (ctx) => {
      const messageId = ctx?.messageReactionCount?.message_id;
      this.logService.write(`Reactions number grew for post with ${messageId} id!`);

      if (!ctx.messageReactionCount || !ctx.messageReactionCount.reactions) return;

      const customReactions = ctx.messageReactionCount.reactions.filter((el) => {
        // @ts-ignore // in reality custom_emoji_id exists
        return el.type?.custom_emoji_id in VALID_CUSTOM_EMOJI_ENUM;
      });
      if (!customReactions || !customReactions.length) return;
      const customReactionsTotalCount = customReactions.map((el) => el.total_count).reduce((acc, curr) => acc + curr, 0);
      this.logService.write(`Number of crocodiles reactions on post: ${customReactionsTotalCount}`);

      const reactionsGoal: number = Number(this.configService.get('TELEGRAM_POST_REACTIONS_GOAL', 200));
      if (customReactionsTotalCount < reactionsGoal) return;
      this.logService.write(`Post with ${messageId} id reached a reactions number goal!`);

      const postData = await this.cache.get(`${MESSAGE_ID_PREFIX}_${ctx.messageReactionCount.message_id}`);
      this.logService.write(`postData: ${JSON.stringify(postData)}`);
      if (!postData) return;
      await this.cache.del(`${MESSAGE_ID_PREFIX}_${ctx.messageReactionCount.message_id}`);

      await this.telegramService.sendAlert(
        `Пост с id ${ctx.messageReactionCount.message_id} набрал нужное кол-во крокодилов в ${reactionsGoal} штук!` +
          `\n\nТекст: "${postData.text}"` +
          `\n\nСсылка на пост: ${BASE_TELEGRAM_POST_URL}${ctx.messageReactionCount.message_id}`,
      );
    });

    this.telegramService.telegraf.launch({
      allowedUpdates: ['message_reaction_count', 'message', 'channel_post'],
    });
  }
}
