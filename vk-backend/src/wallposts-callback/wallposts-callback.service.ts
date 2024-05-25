import { Body, Inject, Injectable } from '@nestjs/common';
import { LogService } from '../log/log.service';
import { TelegramService } from '../telegram/telegram.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { VkService } from '../vk/vk.service';
import { ConfigService, ConfigType } from '@nestjs/config';
import mainGlobalConfig from '../common/config/main-global.config';
import { addIdToPostponedPostText } from './wallposts-callback.helper';

@Injectable()
export class WallpostsCallbackService {
  constructor(
    private readonly logService: LogService,
    private readonly telegram: TelegramService,
    private readonly cache: CacheStorageService,
    private readonly vk: VkService,
    private readonly configService: ConfigService,
    @Inject(mainGlobalConfig.KEY)
    private readonly mainConfig: ConfigType<typeof mainGlobalConfig>,
  ) {
    this.logService.setScope('WALLPOSTS_CALLBACK');
  }

  async sendMsg(@Body() body: IWallPost): Promise<void> {
    this.logService.write(`Получили новый запрос! \n Полученный полный объект запроса: ${JSON.stringify(body)}`);
    const userId = body.object.created_by;

    this.telegram.create(
      this.configService.get<string>('TELEGRAM_BOT_API_TOKEN'),
      this.configService.get<string>('TELEGRAM_CHAT_ID'),
      this.configService.get<string>('TELEGRAM_ADMIN_USER_ID'),
    );

    const userIsDon = await this.vk.checkIfDonById(userId, this.configService.get<string>('VK_GROUP_ID'));
    this.logService.write(`Пост от Дона? — ${userIsDon}`);
    if (userIsDon && body.object.post_type === 'suggest') {
      this.logService.write(`Пост в предложке от Дона (id ${userId}). Отправляем уведомление`);

      const userFullName = await this.vk.getUserFullName(userId);

      const receiverUserIds = this.configService
        .get<string>('DON_ALERTS_USER_IDS', '30152694')
        .split(',')
        .map((value) => Number(value));

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

    await this.telegram.sendAlert(JSON.stringify(body, null, 2));

    // const samePostId = await this.cache.get(`${CACHE_KEYS.EVENT_ID}_${body.event_id}`);
    // if (samePostId) {
    //   this.logService.error(`Пост с таким id (${body.event_id}) уже был. Пропускаем`);
    //   await this.telegram.sendAlert(`Пост с таким id (${body.event_id}) уже был. Пропускаем`);
    //   return;
    // }
    // await this.cache.set(`${CACHE_KEYS.EVENT_ID}_${body.event_id}`, true);

    if (!body.object.attachments.length) {
      this.logService.error(`В посте нет вложений. Пропускаем`);
      return;
    }

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
    if (!post) return this.logService.error(`No post with id of ${postId} was found`);
    if (!post?.items[0] || !post?.items[0]?.text || !post?.items[0]?.attachments[0])
      return this.logService.error(`No text or attachments in post with id of ${postId}`);
    const postText = post.items[0].text;
    this.logService.write(`Received post text: "${postText}"`);

    if (!postText.includes(this.mainConfig.VK_UNPUBLISHED_TAG))
      return this.logService.write(`No unpublished tag ${this.mainConfig.VK_UNPUBLISHED_TAG} in post with id of ${postId}`);
    if (postText.includes(`${this.mainConfig.VK_UNPUBLISHED_TAG}_`))
      return this.logService.write(`We have already marked this post with id of ${postId}`);
    const modifiedPostText = addIdToPostponedPostText(postText, this.mainConfig.VK_UNPUBLISHED_TAG, Math.round(Math.random() * 1000));

    const attachment = post.items[0].attachments[0];
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
