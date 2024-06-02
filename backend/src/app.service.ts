import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string; date: string } {
    return {
      status: 'online',
      date: new Date().toLocaleString('ru-RU'),
    };
  }
}
