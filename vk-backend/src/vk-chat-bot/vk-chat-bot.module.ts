import { Module } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkModule } from '../vk/vk.module';
import { LogModule } from '../log/log.module';
import { ConverterModule } from '../converter/converter.module';

@Module({
  imports: [VkModule, LogModule, ConverterModule],
  providers: [VkChatBotService],
})
export class VkChatBotModule {}
