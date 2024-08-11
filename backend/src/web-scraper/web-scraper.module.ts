import { Module } from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';
import { LogModule } from '../log/log.module';

@Module({
  imports: [LogModule],
  providers: [WebScraperService],
  exports: [WebScraperService],
})
export class WebScraperModule {}
