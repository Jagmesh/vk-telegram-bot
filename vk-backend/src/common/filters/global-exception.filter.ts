import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import { LogService } from '../../log/log.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logService: LogService) {
    this.logService.setScope('GLOBAL_EXCEPTION_FILTER');
  }

  public catch(exception: HttpException | Error | unknown, host: ArgumentsHost) {
    this.logService.write('ЗАШЛИ В ОБРАБОТЧИК');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof Error) {
      this.logService.error(JSON.stringify(exception.message));
    }

    this.logService.write('Обработали ошибку и ничего не сломалось!');

    throw exception;
  }
}
