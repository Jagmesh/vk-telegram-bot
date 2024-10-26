import { MESSAGE_ID_PREFIX } from '../../telegram/telegraf-bot/telegraf-bot.consts';

export function addAuthorNameToMsg(msg: string, userName: string, keyStringToReplace: string): string {
  return msg.replace(keyStringToReplace, `${keyStringToReplace} Автор: ${userName}`);
}

export function getPostIdRecordKey(telegramPostId: number): string {
  return `${MESSAGE_ID_PREFIX}_${telegramPostId}`;
}
