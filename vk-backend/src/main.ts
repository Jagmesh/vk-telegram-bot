import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VkChatBotRouter } from './vk-chat-bot/vk-chat-bot.router';
import { TelegrafBotService } from './telegraf-bot/telegraf-bot.service';

async function bootstrap() {
  const port = process.env.PORT || 1337;
  const app = await NestFactory.create(AppModule);

  await app.get(VkChatBotRouter).start();
  app.get(TelegrafBotService).hookOnChannelReactions();

  await app.listen(port);
  console.log(`[LOG] Launched at ${port} port`);
}
bootstrap();
