import { registerAs } from '@nestjs/config';
import * as process from 'process';

export default registerAs('mainGlobal', () => ({
  NODE_ENV: <'development' | 'production'>process.env.NODE_ENV || 'development',

  APP_PORT: Number(process.env.APP_PORT || 1337),

  MEMCACHED_HOST: process.env.MEMCACHED_HOST,
  MEMCACHED_PORT: process.env.MEMCACHED_PORT,
  MEMCACHED_DEFAULT_TTL: process.env.MEMCACHED_DEFAULT_TTL
    ? process.env.MEMCACHED_DEFAULT_TTL.split('*')
        .map((el) => Number(el))
        .reduce((previousValue, currentValue) => previousValue * currentValue)
    : null,

  RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST,
  RABBIT_MQ_PORT: Number(process.env.RABBIT_MQ_PORT) || 5672,
  RABBIT_MQ_USER_NAME: process.env.RABBIT_MQ_USER_NAME,
  RABBIT_MQ_PASSWORD: process.env.RABBIT_MQ_PASSWORD,

  VK_MAIN_GROUP_API_TOKEN: process.env.VK_MAIN_GROUP_API_TOKEN,
  VK_APP_API_TOKEN: process.env.VK_APP_API_TOKEN,
  VK_GROUP_ID: Number(process.env.VK_GROUP_ID),
  VK_DON_ALERTS_USER_IDS: process.env.VK_DON_ALERTS_USER_IDS || '30152694',
  VK_UNPUBLISHED_TAG: process.env.VK_UNPUBLISHED_TAG,
  VK_UNPUBLISHED_PROCESSED_TAG: process.env.VK_UNPUBLISHED_PROCESSED_TAG,

  TELEGRAM_BOT_API_TOKEN: process.env.TELEGRAM_BOT_API_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TELEGRAM_ADMIN_USER_ID: process.env.TELEGRAM_ADMIN_USER_ID,
  TELEGRAM_POST_REACTIONS_GOAL: Number(process.env.TELEGRAM_POST_REACTIONS_GOAL || 200),

  VIDEO_MAX_DURATION: Number(process.env.VIDEO_MAX_DURATION || 30),
}));
