import { Body, Inject, Injectable } from '@nestjs/common';
import { LogService } from '../../log/log.service';
import { TelegramService } from '../../telegram/telegram.service';
import { CacheStorageService } from '../../cache-storage/cache-storage.service';
import { VkService } from '../vk.service';
import mainGlobalConfig from '../../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';
import { MESSAGE_ID_PREFIX } from '../../telegram/telegraf-bot/telegraf-bot.consts';

@Injectable()
export class WallpostsCallbackService {
  constructor(
    private readonly logService: LogService,
    private readonly telegram: TelegramService,
    private readonly cache: CacheStorageService,
    private readonly vk: VkService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
  ) {
    this.logService.setScope('WALLPOSTS_CALLBACK');

    this.telegram.create(this.mainConfig.TELEGRAM_BOT_API_TOKEN, this.mainConfig.TELEGRAM_CHAT_ID, this.mainConfig.TELEGRAM_ADMIN_USER_ID);
  }

  async sendMsg(@Body() body: IWallPost): Promise<void> {
    this.logService.write(`New request received! \n Request body: ${JSON.stringify(body)}`);
    const userId = body.object.created_by;

    const userIsDon = await this.vk.checkIfDonById(userId, this.mainConfig.VK_GROUP_ID);
    this.logService.write(`Post from Don? — ${userIsDon}`);
    if (userIsDon && body.object.post_type === 'suggest') {
      this.logService.write(`Пост в предложке от Дона (id ${userId}). Отправляем уведомление`);

      const userFullName = await this.vk.getUserFullName(userId);

      const receiverUserIds = this.mainConfig.VK_DON_ALERTS_USER_IDS.split(',').map((value) => Number(value));

      const attachment = body.object.attachments[0]?.doc
        ? `doc${body.object.attachments[0].doc.owner_id}_${body.object.attachments[0].doc.id}`
        : undefined;

      await this.vk.sendMessage(
        `Дон ${userFullName} (id ${userId}) отправил пост в предложку: \n\n` + `${body.object.text}`,
        receiverUserIds,
        {
          attachment,
        },
      );

      return;
    }

    if (body.object.donut.is_donut) {
      this.logService.write(`Получили пост для донов (is_donut: ${body.object.donut.is_donut}). Пропускаем`);
      return;
    }

    if (body.object.post_type !== 'post') {
      this.logService.write(`Получили post_type: ${body.object.post_type}. Пропускаем`);
      return;
    }

    if (body.object.marked_as_ads) {
      this.logService.write(`Получили marked_as_ads: ${body.object.marked_as_ads}. Пропускаем`);
      return;
    }

    if (!body.object.attachments.length) {
      this.logService.error(`В посте нет вложений. Пропускаем`);
      return;
    }

    if (body.object.text.includes(`${this.mainConfig.VK_UNPUBLISHED_PROCESSED_TAG}`))
      return this.logService.write(`We have already posted this in Telegram`);

    for (const element of body.object.attachments) {
      if (element.doc && body.object.text) {
        await this.telegram.sendDocument(element.doc.url, body.object.text);
      }
    }
  }

  async checkPostponesWallPost(wallPost: IWallPost) {
    const postId = wallPost?.object?.id;
    if (!postId) return this.logService.error('There is no post id in callback');

    const post = await this.vk.vkUser.api.wall.getById({ posts: `-${this.mainConfig.VK_GROUP_ID}_${postId}` });
    if (!post || !post.items || !post.items[0]) return this.logService.error(`No post with id of ${postId} was found`);
    const { text: postText, attachments } = post.items[0];
    if (!postText || !attachments[0]) return this.logService.error(`No text or attachments in post with id of ${postId}`);
    this.logService.write(`Received post text: "${postText}"`);
    const attachment = attachments[0];

    if (!postText.includes(this.mainConfig.VK_UNPUBLISHED_TAG))
      return this.logService.write(`No unpublished tag ${this.mainConfig.VK_UNPUBLISHED_TAG} in post with id of ${postId}`);
    if (postText.includes(`${this.mainConfig.VK_UNPUBLISHED_PROCESSED_TAG}`))
      return this.logService.write(`We have already marked this post with id of ${postId}`);

    const telegramPostId = await this.telegram.sendDocument(attachment.doc.url, postText);
    if (!telegramPostId) return this.logService.error(`No telegram post id received`);
    await this.cache.set<ITgToVkCachedData>(`${MESSAGE_ID_PREFIX}_${telegramPostId}`, {
      vkPostId: postId,
      text: postText,
    });

    const modifiedPostText = postText.replace(this.mainConfig.VK_UNPUBLISHED_TAG, this.mainConfig.VK_UNPUBLISHED_PROCESSED_TAG);
    const finalAttachmentString = `${attachment.type}${attachment.doc.owner_id}_${attachment.doc.id}`;

    this.logService.write(`Final attachment string: ${finalAttachmentString}`);
    await this.vk.vkUser.api.wall.edit({
      post_id: postId,
      owner_id: -`${this.mainConfig.VK_GROUP_ID}`,
      publish_date: post.items[0].date,
      message: modifiedPostText,
      attachments: finalAttachmentString,
    });
  }
}
