import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@nestjs-plus/rabbitmq';
import { DELAYED_MESSAGE_EXCHANGE_NAME } from './message-queue.const';
import { LogService } from '../log/log.service';

@Injectable()
export class MessageQueueService {
  constructor(private readonly amqpConnection: AmqpConnection, private readonly logService: LogService) {
    this.logService.setScope('MESSAGE_QUEUE_SERVICE');
  }

  async scheduleDelayedMessage<T extends Record<any, any>>(msg: T, delayInMS: number = 60 * 1000) {
    await this.amqpConnection.publish(DELAYED_MESSAGE_EXCHANGE_NAME, '', msg, { headers: { 'x-delay': delayInMS } });

    this.logService.write(`Scheduled delayed message ${JSON.stringify(msg)} for ${delayInMS / 1000} seconds`);
  }
}
