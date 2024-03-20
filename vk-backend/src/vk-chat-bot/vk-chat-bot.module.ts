import { Module } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkModule } from '../vk/vk.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [VkModule, LogModule],
  providers: [VkChatBotService],
})
export class VkChatBotModule {}
