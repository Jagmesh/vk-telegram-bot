import { VALID_CUSTOM_EMOJI_ENUM } from './telegraf-bot.consts';

export function findCustomEmoji(emojiId: string): keyof typeof VALID_CUSTOM_EMOJI_ENUM | null {
  if (!emojiId) return null;

  for (const emojiKey in VALID_CUSTOM_EMOJI_ENUM) {
    if (VALID_CUSTOM_EMOJI_ENUM[emojiKey] === emojiId) return emojiKey as keyof typeof VALID_CUSTOM_EMOJI_ENUM;
  }
  return null;
}
