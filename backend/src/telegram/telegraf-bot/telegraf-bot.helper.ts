import { VALID_CUSTOM_EMOJI_ENUM } from './telegraf-bot.consts';

export function checkIfCustomEmoji(emojiId: string): boolean {
  if (!emojiId) return false;

  for (const emojiElement in VALID_CUSTOM_EMOJI_ENUM) {
    if (VALID_CUSTOM_EMOJI_ENUM[emojiElement] === emojiId) return true;
  }
  return false;
}
