import { Module } from '@nestjs/common';
import { VkChatBotService } from './vk-chat-bot.service';
import { VkChatBotRouter } from './vk-chat-bot.router';
import { VkModule } from '../vk.module';
import { LogModule } from '../../log/log.module';
import { ConverterModule } from '../../converter/converter.module';
import { YtDlpModule } from '../../yt-dlp/yt-dlp.module';
import { VkSessionModule } from './vk-session/vk-session.module';

@Module({
  imports: [VkModule, VkSessionModule, LogModule, ConverterModule, YtDlpModule],
  providers: [VkChatBotService, VkChatBotRouter],
})
export class VkChatBotModule {}
