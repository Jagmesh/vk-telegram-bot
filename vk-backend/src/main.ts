import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TelegrafBotService } from './telegraf-bot/telegraf-bot.service';

async function bootstrap() {
  const port = process.env.PORT || 1337;
  const app = await NestFactory.create(AppModule);

  // await app.get(VkChatBotService).start();
  app.get(TelegrafBotService).hookOnChannelReactions();

  await app.listen(port);
  console.log(`[LOG] Launched at ${port} port`);
}
bootstrap();
