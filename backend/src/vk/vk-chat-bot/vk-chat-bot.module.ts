import { Module } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkChatBotRouter } from './vk-chat-bot.router';
import { VkModule } from '../vk.module';
import { LogModule } from '../../log/log.module';
import { ConverterModule } from '../../converter/converter.module';

@Module({
  imports: [VkModule, LogModule, ConverterModule],
  providers: [VkChatBotService, VkChatBotRouter],
})
export class VkChatBotModule {}
