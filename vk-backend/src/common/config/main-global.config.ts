import { registerAs } from '@nestjs/config';
import * as process from 'process';

export default registerAs('mainGlobal', () => ({
  VK_MAIN_GROUP_API_TOKEN: process.env.VK_MAIN_GROUP_API_TOKEN,
  VK_NOTIFICATION_GROUP_API_TOKEN: process.env.VK_NOTIFICATION_GROUP_API_TOKEN,
  VK_APP_API_TOKEN: process.env.VK_APP_API_TOKEN,
  VK_GROUP_ID: process.env.VK_GROUP_ID,
  VK_UNPUBLISHED_TAG: process.env.VK_UNPUBLISHED_TAG,
}));
