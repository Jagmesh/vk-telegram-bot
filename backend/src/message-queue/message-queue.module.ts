import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@nestjs-plus/rabbitmq';
import { MessageQueueService } from './message-queue.service';
import { LogModule } from '../log/log.module';
import { DELAYED_MESSAGE_EXCHANGE_NAME } from './message-queue.const';
import mainGlobalConfig from '../common/config/main-global.config';
import { ConfigType } from '@nestjs/config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [mainGlobalConfig.KEY],
      useFactory: async (mainConfig: ConfigType<typeof mainGlobalConfig>) => ({
        exchanges: [
          {
            name: DELAYED_MESSAGE_EXCHANGE_NAME,
            type: 'x-delayed-message',
            options: {
              arguments: { 'x-delayed-type': 'direct' },
            },
          },
        ],
        uri:
          `amqp://${mainConfig.RABBIT_MQ_USER_NAME}:${mainConfig.RABBIT_MQ_PASSWORD}` +
          `@${mainConfig.RABBIT_MQ_HOST}:${mainConfig.RABBIT_MQ_PORT}`,
      }),
    }),
    LogModule,
  ],
  providers: [MessageQueueService],
  exports: [MessageQueueService],
})
export class MessageQueueModule {}
