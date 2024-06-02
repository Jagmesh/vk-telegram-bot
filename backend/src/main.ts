import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigType } from '@nestjs/config';
import { LogService } from './log/log.service';
import mainGlobalConfig from './common/config/main-global.config';
import { VkChatBotRouter } from './vk/vk-chat-bot/vk-chat-bot.router';
import { TelegrafBotService } from './telegram/telegraf-bot/telegraf-bot.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const mainConfig: ConfigType<typeof mainGlobalConfig> = app.get(mainGlobalConfig.KEY);

  await app.get(VkChatBotRouter).start();
  if (mainConfig.NODE_ENV === 'production') app.get(TelegrafBotService).hookOnChannelReactions();

  const port = mainConfig.APP_PORT;
  await app.listen(port);
  await app.resolve(LogService).then((log) => log.setScope('BOOTSTRAP').write(`Launched at ${port} port`));
}

bootstrap();
